// Modelo de pagos y cuotas — Sprint 2.
//
// Cubre el "Flujo de pago de cuota" y "Actualizar estado de cuenta tras pago"
// (Backend 2) y las "Proyecciones financieras" / "Generar recibo" (Backend 1).

import { db } from '../db/index.js'
import { aNumero, aPesos, aFechaISO, aInstanteISO, claveDeMes, sumarPor } from '../utils/numeros.js'

export const METODOS_PAGO = ['transferencia', 'tarjeta', 'efectivo', 'domiciliacion']
export const ESTATUS_CUOTA = ['pendiente', 'parcial', 'pagada', 'vencida']

const hoy = () => new Date().toISOString().slice(0, 10)

function normalizarPago(pago) {
  if (!pago) return null
  return {
    ...pago,
    monto: aPesos(pago.monto),
    fecha: aInstanteISO(pago.fecha),
    cuotaId: pago.cuotaId ?? null,
  }
}

function normalizarCuota(cuota) {
  if (!cuota) return null
  return { ...cuota, monto: aPesos(cuota.monto), venceEn: aFechaISO(cuota.venceEn) }
}

/* ── Consultas base ─────────────────────────────────────────────────────── */

export async function listarPagos({ usuarioId } = {}) {
  const pagos = await db().pagos.todos({ usuarioId }, { orden: 'fecha', direccion: 'desc' })
  return pagos.map(normalizarPago)
}

export async function obtenerPagoPorId(id) {
  return normalizarPago(await db().pagos.porId(id))
}

export async function listarCuotas({ usuarioId, estatus } = {}) {
  const cuotas = await db().cuotas.todos({ usuarioId, estatus }, { orden: 'venceEn' })
  return cuotas.map(normalizarCuota)
}

/* ── Estado de cuenta ───────────────────────────────────────────────────── */

// Estatus derivado: lo que realmente se pagó manda sobre el valor almacenado,
// y una cuota sin cubrir cuya fecha ya pasó se reporta como vencida.
function estatusDerivado(cuota, pagado) {
  if (pagado >= aNumero(cuota.monto)) return 'pagada'
  if (aFechaISO(cuota.venceEn) < hoy()) return 'vencida'
  return pagado > 0 ? 'parcial' : 'pendiente'
}

export async function obtenerEstadoCuenta(usuarioId) {
  const id = Number(usuarioId)
  const [cuotas, pagos] = await Promise.all([listarCuotas({ usuarioId: id }), listarPagos({ usuarioId: id })])

  const detalle = cuotas.map((cuota) => {
    const pagosDeCuota = pagos.filter((p) => p.cuotaId === cuota.id && p.estatus === 'aplicado')
    const pagado = sumarPor(pagosDeCuota, 'monto')
    const saldo = aPesos(Math.max(0, aNumero(cuota.monto) - pagado))
    return { ...cuota, pagado, saldo, estatus: estatusDerivado(cuota, pagado) }
  })

  const pendientes = detalle.filter((c) => c.saldo > 0)
  const vencidas = pendientes.filter((c) => c.estatus === 'vencida')
  const aplicados = pagos.filter((p) => p.estatus === 'aplicado')

  // Los abonos sin cuota asignada (pagos a cuenta) reducen el adeudo total.
  const saldoCuotas = sumarPor(pendientes, 'saldo')
  const aCuenta = sumarPor(aplicados.filter((p) => p.cuotaId == null), 'monto')
  const saldoPendiente = aPesos(Math.max(0, saldoCuotas - aCuenta))

  const proximaCuota =
    pendientes.filter((c) => c.estatus !== 'vencida').sort((a, b) => a.venceEn.localeCompare(b.venceEn))[0] ?? null

  return {
    usuarioId: id,
    saldoPendiente,
    saldoVencido: sumarPor(vencidas, 'saldo'),
    saldoAFavor: aPesos(Math.max(0, aCuenta - saldoCuotas)),
    totalPagado: sumarPor(aplicados, 'monto'),
    cuotasPendientes: pendientes.length,
    cuotasVencidas: vencidas.length,
    alCorriente: saldoPendiente === 0,
    proximaCuota,
    cuotas: detalle,
    ultimoPago: aplicados[0] ?? null,
    movimientos: aplicados.slice(0, 10),
  }
}

/* ── Flujo de pago ──────────────────────────────────────────────────────── */

// Reglas de asignación: si el pago trae `cuotaId` se aplica a esa cuota; si no,
// se reparte entre las cuotas con saldo, de la más antigua a la más reciente.
async function asignarACuotas({ usuarioId, monto, cuotaId, concepto, metodo, referencia }) {
  const estado = await obtenerEstadoCuenta(usuarioId)
  const pagosCreados = []
  let restante = aPesos(monto)

  const objetivo = cuotaId
    ? estado.cuotas.filter((c) => c.id === Number(cuotaId))
    : estado.cuotas.filter((c) => c.saldo > 0).sort((a, b) => a.venceEn.localeCompare(b.venceEn))

  for (const cuota of objetivo) {
    if (restante <= 0) break
    const aplicar = aPesos(Math.min(restante, cuota.saldo))
    if (aplicar <= 0) continue

    pagosCreados.push(
      await db().pagos.insertar({
        usuarioId: Number(usuarioId),
        cuotaId: cuota.id,
        monto: aplicar,
        concepto: concepto || cuota.concepto,
        metodo,
        referencia,
        estatus: 'aplicado',
        fecha: new Date().toISOString(),
      }),
    )

    const pagadoTotal = aPesos(cuota.pagado + aplicar)
    await db().cuotas.actualizar(cuota.id, { estatus: estatusDerivado(cuota, pagadoTotal) })
    restante = aPesos(restante - aplicar)
  }

  // Excedente (o pago sin cuotas abiertas): queda como abono a cuenta.
  if (restante > 0) {
    pagosCreados.push(
      await db().pagos.insertar({
        usuarioId: Number(usuarioId),
        cuotaId: null,
        monto: restante,
        concepto: concepto || 'Abono a cuenta',
        metodo,
        referencia,
        estatus: 'aplicado',
        fecha: new Date().toISOString(),
      }),
    )
  }

  return pagosCreados.map(normalizarPago)
}

export async function registrarPago({ usuarioId, monto, concepto, metodo = 'transferencia', cuotaId = null, referencia = null }) {
  const pagos = await asignarACuotas({
    usuarioId,
    monto,
    cuotaId,
    concepto,
    metodo,
    referencia: referencia || `REF-${Date.now().toString().slice(-6)}`,
  })

  // "Actualizar estado de cuenta tras pago": el cliente recibe el estado ya
  // recalculado en la misma respuesta, sin tener que volver a consultarlo.
  const estadoCuenta = await obtenerEstadoCuenta(usuarioId)
  return { pagos, estadoCuenta }
}

export async function crearCuota({ usuarioId, periodo, concepto, monto, venceEn }) {
  const cuota = await db().cuotas.insertar({
    usuarioId: Number(usuarioId),
    periodo,
    concepto,
    monto: aPesos(monto),
    venceEn,
    estatus: 'pendiente',
  })
  return normalizarCuota(cuota)
}

/* ── Recibo ─────────────────────────────────────────────────────────────── */

export async function generarRecibo(pagoId) {
  const pago = await obtenerPagoPorId(pagoId)
  if (!pago) return null

  const [usuario, cuota] = await Promise.all([
    db().usuarios.porId(pago.usuarioId),
    pago.cuotaId ? db().cuotas.porId(pago.cuotaId) : Promise.resolve(null),
  ])

  return {
    folio: `REC-${String(pago.id).padStart(6, '0')}`,
    emitidoEn: new Date().toISOString(),
    pago,
    cuota: normalizarCuota(cuota),
    residente: usuario
      ? { id: usuario.id, nombre: usuario.nombre, email: usuario.email, unidad: usuario.unidad }
      : null,
    emisor: { nombre: 'CondoPortal · Administración', rfc: 'CPO260101AAA' },
  }
}

/* ── Agregados financieros ──────────────────────────────────────────────── */

export async function ingresosPorMes() {
  const pagos = (await listarPagos()).filter((p) => p.estatus === 'aplicado')
  const porMes = {}
  for (const pago of pagos) {
    const mes = claveDeMes(pago.fecha)
    porMes[mes] = aPesos((porMes[mes] ?? 0) + aNumero(pago.monto))
  }
  return porMes
}

export async function totalIngresos() {
  const pagos = (await listarPagos()).filter((p) => p.estatus === 'aplicado')
  return sumarPor(pagos, 'monto')
}
