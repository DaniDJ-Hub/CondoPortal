// Modelo del dashboard — Sprint 3.
//
// Reúne en un solo lugar los agregados que consumen "Dashboard con KPIs"
// (Frontend 1), "Gráfico de flujo de caja" (Frontend 2) y "Feed de actividad
// reciente" (Full-Stack/QA), para que las tres vistas compartan los mismos
// números en vez de calcularlos cada una por su cuenta.

import { db } from '../db/index.js'
import { listarGastos, totalesPorMes, resumenPorCategoria } from './gasto.model.js'
import { listarPagos, listarCuotas, ingresosPorMes } from './pago.model.js'
import { aPesos, aNumero, claveDeMes, sumarPor, aInstanteISO, aFechaISO } from '../utils/numeros.js'

const NOMBRES_MES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

export function etiquetaDeMes(clave) {
  const [anio, mes] = clave.split('-')
  return `${NOMBRES_MES[Number(mes) - 1] ?? mes} ${anio.slice(2)}`
}

// Devuelve los últimos `cantidad` meses terminando en el más reciente que
// aparezca en los datos, para que el gráfico nunca muestre huecos al final.
function ventanaDeMeses(claves, cantidad) {
  const ordenadas = [...new Set(claves)].sort()
  if (ordenadas.length === 0) return []

  const [anio, mes] = ordenadas.at(-1).split('-').map(Number)
  const ventana = []
  for (let i = cantidad - 1; i >= 0; i--) {
    const fecha = new Date(Date.UTC(anio, mes - 1 - i, 1))
    ventana.push(`${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`)
  }
  return ventana
}

/* ── Flujo de caja ──────────────────────────────────────────────────────── */

export async function flujoDeCaja({ meses = 6 } = {}) {
  const [gastosMes, ingresosMes] = await Promise.all([totalesPorMes(), ingresosPorMes()])
  const ventana = ventanaDeMeses([...Object.keys(gastosMes), ...Object.keys(ingresosMes)], meses)

  // El saldo acumulado arranca contando todo lo anterior a la ventana, para
  // que la línea de saldo sea continua y no empiece artificialmente en cero.
  const primerMes = ventana[0] ?? ''
  let acumulado = aPesos(
    Object.entries(ingresosMes).reduce((t, [m, v]) => (m < primerMes ? t + aNumero(v) : t), 0) -
      Object.entries(gastosMes).reduce((t, [m, v]) => (m < primerMes ? t + aNumero(v) : t), 0),
  )

  const serie = ventana.map((mes) => {
    const ingresos = aPesos(ingresosMes[mes] ?? 0)
    const egresos = aPesos(gastosMes[mes] ?? 0)
    acumulado = aPesos(acumulado + ingresos - egresos)
    return { mes, etiqueta: etiquetaDeMes(mes), ingresos, egresos, neto: aPesos(ingresos - egresos), saldo: acumulado }
  })

  return {
    serie,
    totales: {
      ingresos: sumarPor(serie, 'ingresos'),
      egresos: sumarPor(serie, 'egresos'),
      neto: sumarPor(serie, 'neto'),
      saldoFinal: serie.at(-1)?.saldo ?? 0,
    },
  }
}

/* ── KPIs ───────────────────────────────────────────────────────────────── */

function variacion(actual, anterior) {
  if (!anterior) return null
  return Math.round(((actual - anterior) / anterior) * 1000) / 10
}

export async function indicadores() {
  const [gastos, pagos, cuotas, usuarios, { serie }] = await Promise.all([
    listarGastos(),
    listarPagos(),
    listarCuotas(),
    db().usuarios.todos(),
    flujoDeCaja({ meses: 2 }),
  ])

  const aplicados = pagos.filter((p) => p.estatus === 'aplicado')
  const totalIngresos = sumarPor(aplicados, 'monto')
  const totalEgresos = sumarPor(gastos, 'monto')

  const [anterior, actual] = serie.length >= 2 ? serie : [null, serie[0] ?? null]

  // Morosidad: unidades con al menos una cuota vencida y sin cubrir.
  const hoy = new Date().toISOString().slice(0, 10)
  const pagadoPorCuota = new Map()
  for (const pago of aplicados) {
    if (pago.cuotaId == null) continue
    pagadoPorCuota.set(pago.cuotaId, aPesos((pagadoPorCuota.get(pago.cuotaId) ?? 0) + aNumero(pago.monto)))
  }
  const vencidas = cuotas.filter(
    (c) => aFechaISO(c.venceEn) < hoy && (pagadoPorCuota.get(c.id) ?? 0) < aNumero(c.monto),
  )
  const residentes = usuarios.filter((u) => u.rol === 'residente' && u.activo !== false)
  const morosos = new Set(vencidas.map((c) => c.usuarioId))
  const porCobrar = aPesos(
    vencidas.reduce((total, c) => total + (aNumero(c.monto) - (pagadoPorCuota.get(c.id) ?? 0)), 0),
  )

  return {
    saldoActual: aPesos(totalIngresos - totalEgresos),
    totalIngresos,
    totalEgresos,
    ingresosDelMes: actual?.ingresos ?? 0,
    egresosDelMes: actual?.egresos ?? 0,
    variacionIngresos: variacion(actual?.ingresos ?? 0, anterior?.ingresos ?? 0),
    variacionEgresos: variacion(actual?.egresos ?? 0, anterior?.egresos ?? 0),
    porCobrar,
    cuotasVencidas: vencidas.length,
    residentes: residentes.length,
    residentesMorosos: morosos.size,
    tasaMorosidad: residentes.length === 0 ? 0 : Math.round((morosos.size / residentes.length) * 1000) / 10,
    mesActual: actual?.mes ?? null,
    etiquetaMesActual: actual?.etiqueta ?? null,
  }
}

/* ── Actividad reciente ─────────────────────────────────────────────────── */

export async function actividadReciente({ limite = 12 } = {}) {
  const [gastos, pagos, usuarios, negocios] = await Promise.all([
    listarGastos(),
    listarPagos(),
    db().usuarios.todos(),
    db().negocios.todos(),
  ])

  const nombrePorId = new Map(usuarios.map((u) => [u.id, u.nombre]))

  const eventos = [
    ...pagos.map((pago) => ({
      id: `pago-${pago.id}`,
      tipo: 'pago',
      titulo: pago.concepto,
      detalle: nombrePorId.get(pago.usuarioId) ?? 'Residente',
      monto: pago.monto,
      signo: 1,
      fecha: aInstanteISO(pago.fecha),
    })),
    ...gastos.map((gasto) => ({
      id: `gasto-${gasto.id}`,
      tipo: 'gasto',
      titulo: gasto.descripcion,
      detalle: gasto.proveedor ?? 'Administración',
      monto: gasto.monto,
      signo: -1,
      fecha: aInstanteISO(`${gasto.fecha}T12:00:00.000Z`),
    })),
    ...usuarios.map((usuario) => ({
      id: `usuario-${usuario.id}`,
      tipo: 'usuario',
      titulo: `${usuario.nombre} se unió al portal`,
      detalle: usuario.unidad ? `Unidad ${usuario.unidad}` : usuario.rol,
      monto: null,
      signo: 0,
      fecha: aInstanteISO(usuario.creadoEn),
    })),
    ...negocios.map((negocio) => ({
      id: `negocio-${negocio.id}`,
      tipo: 'negocio',
      titulo: `${negocio.nombre} entró al marketplace`,
      detalle: negocio.categoria,
      monto: null,
      signo: 0,
      fecha: aInstanteISO(negocio.creadoEn),
    })),
  ]

  return eventos
    .filter((evento) => evento.fecha)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, limite)
}

/* ── Proyecciones ───────────────────────────────────────────────────────── */

function promedio(valores) {
  if (valores.length === 0) return 0
  return aPesos(valores.reduce((t, v) => t + aNumero(v), 0) / valores.length)
}

// Backend 1 — Sprint 2: "Proyecciones financieras".
export async function proyecciones({ meses = 3 } = {}) {
  const [gastosMes, ingresosMes, porCategoria] = await Promise.all([
    totalesPorMes(),
    ingresosPorMes(),
    resumenPorCategoria(),
  ])

  const promedioIngresos = promedio(Object.values(ingresosMes))
  const promedioEgresos = promedio(Object.values(gastosMes))
  const netoMensual = aPesos(promedioIngresos - promedioEgresos)

  const totalIngresos = aPesos(Object.values(ingresosMes).reduce((t, v) => t + aNumero(v), 0))
  const totalEgresos = aPesos(Object.values(gastosMes).reduce((t, v) => t + aNumero(v), 0))
  let saldo = aPesos(totalIngresos - totalEgresos)

  const ultimoMes = [...Object.keys({ ...gastosMes, ...ingresosMes })].sort().at(-1) ?? claveDeMes(new Date())
  const [anio, mes] = ultimoMes.split('-').map(Number)

  const proyeccion = []
  for (let i = 1; i <= meses; i++) {
    const fecha = new Date(Date.UTC(anio, mes - 1 + i, 1))
    const clave = `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, '0')}`
    saldo = aPesos(saldo + netoMensual)
    proyeccion.push({
      mes: clave,
      etiqueta: etiquetaDeMes(clave),
      ingresosEstimados: promedioIngresos,
      egresosEstimados: promedioEgresos,
      saldoEstimado: saldo,
    })
  }

  return {
    totalIngresos,
    totalEgresos,
    saldoActual: aPesos(totalIngresos - totalEgresos),
    promedioIngresosMensual: promedioIngresos,
    promedioEgresosMensual: promedioEgresos,
    netoMensual,
    // Meses que el fondo aguanta si el neto es negativo.
    mesesDeReserva:
      netoMensual >= 0 ? null : Math.max(0, Math.floor(aPesos(totalIngresos - totalEgresos) / Math.abs(netoMensual))),
    proyeccion,
    detalle: { gastosPorMes: gastosMes, ingresosPorMes: ingresosMes, gastosPorCategoria: porCategoria },
  }
}
