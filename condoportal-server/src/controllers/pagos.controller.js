// Controlador de pagos — Sprint 2.
//
// Backend 2: "Flujo de pago de cuota" y "Actualizar estado de cuenta tras pago".
// Backend 1: "Proyecciones financieras" y "Generar recibo de pago".

import {
  registrarPago,
  obtenerEstadoCuenta,
  generarRecibo as construirRecibo,
  listarPagos,
  listarCuotas,
  crearCuota,
  METODOS_PAGO,
} from '../models/pago.model.js'
import { proyecciones } from '../models/dashboard.model.js'
import { buscarUsuarioPorId } from '../models/usuario.model.js'
import { asyncHandler, errorNoEncontrado, errorPeticion } from '../middleware/errorHandler.js'
import { requerirCampos, validarMonto, validarOpcion, validarId, validarFecha } from '../middleware/validar.js'

// Un residente sólo puede operar sobre su propia cuenta; un admin sobre todas.
function resolverUsuarioObjetivo(req, idSolicitado) {
  const id = idSolicitado === undefined ? req.usuario.id : validarId(idSolicitado, 'id del usuario')
  if (req.usuario.rol !== 'admin' && Number(id) !== Number(req.usuario.id)) {
    throw errorPeticion('Sólo puedes operar sobre tu propia cuenta.')
  }
  return Number(id)
}

// GET /api/pagos/estado-cuenta        → la del usuario autenticado
// GET /api/pagos/estado-cuenta/:usuarioId → la de otro (sólo admin)
export const estadoCuenta = asyncHandler(async (req, res) => {
  const usuarioId = resolverUsuarioObjetivo(req, req.params.usuarioId)
  if (!(await buscarUsuarioPorId(usuarioId))) throw errorNoEncontrado('Usuario no encontrado.')
  res.status(200).json(await obtenerEstadoCuenta(usuarioId))
})

// POST /api/pagos/pagar
export const pagarCuota = asyncHandler(async (req, res) => {
  requerirCampos(req.body, ['monto'])

  const usuarioId = resolverUsuarioObjetivo(req, req.body.usuarioId)
  if (!(await buscarUsuarioPorId(usuarioId))) throw errorNoEncontrado('Usuario no encontrado.')

  const metodo = req.body.metodo
    ? validarOpcion(req.body.metodo, METODOS_PAGO, 'El método de pago')
    : 'transferencia'

  let cuotaId = null
  if (req.body.cuotaId != null) {
    cuotaId = validarId(req.body.cuotaId, 'id de la cuota')
    const cuotas = await listarCuotas({ usuarioId })
    if (!cuotas.some((c) => c.id === cuotaId)) {
      throw errorNoEncontrado('La cuota indicada no pertenece a esta cuenta.')
    }
  }

  const { pagos, estadoCuenta: estado } = await registrarPago({
    usuarioId,
    monto: validarMonto(req.body.monto),
    concepto: req.body.concepto,
    metodo,
    cuotaId,
    referencia: req.body.referencia,
  })

  res.status(201).json({
    pagos,
    // Con el estado recalculado en la respuesta, el cliente refresca la vista
    // sin una segunda petición.
    estadoCuenta: estado,
    recibo: await construirRecibo(pagos[0].id),
  })
})

// GET /api/pagos/:pagoId/recibo
export const generarRecibo = asyncHandler(async (req, res) => {
  const recibo = await construirRecibo(validarId(req.params.pagoId, 'id del pago'))
  if (!recibo) throw errorNoEncontrado('Recibo no encontrado.')

  if (req.usuario.rol !== 'admin' && Number(recibo.pago.usuarioId) !== Number(req.usuario.id)) {
    throw errorPeticion('Sólo puedes consultar tus propios recibos.')
  }

  res.status(200).json(recibo)
})

// GET /api/pagos/movimientos — historial que consume el cliente (Frontend 2).
//
// Devuelve un libro de movimientos, no sólo los pagos: cada cuota emitida es
// un cargo que aumenta el adeudo y cada pago un abono que lo reduce. Así el
// saldo corrido de la columna derecha tiene un significado real.
export const movimientos = asyncHandler(async (req, res) => {
  const usuarioId = resolverUsuarioObjetivo(req, req.query.usuarioId)
  const estado = await obtenerEstadoCuenta(usuarioId)
  const pagos = await listarPagos({ usuarioId })

  const cargos = estado.cuotas.map((cuota) => ({
    id: `CAR-${String(cuota.id).padStart(6, '0')}`,
    referenciaId: cuota.id,
    // La fecha del movimiento es la de emisión (inicio del periodo), no la de
    // vencimiento: si no, una cuota que vence a fin de mes se colaría por
    // encima de los pagos de hoy.
    fecha: `${cuota.periodo}-01`,
    venceEn: cuota.venceEn,
    concepto: cuota.concepto,
    tipo: 'cargo',
    metodo: null,
    monto: cuota.monto,
    estado: cuota.estatus,
    periodo: cuota.periodo,
  }))

  const abonos = pagos.map((pago) => ({
    id: `MOV-${String(pago.id).padStart(6, '0')}`,
    referenciaId: pago.id,
    fecha: pago.fecha.slice(0, 10),
    concepto: pago.concepto,
    venceEn: null,
    tipo: 'pago',
    metodo: pago.metodo,
    monto: pago.monto,
    estado: pago.estatus === 'aplicado' ? 'completado' : pago.estatus,
    periodo: null,
  }))

  // Del más antiguo al más reciente para acumular el saldo, y se devuelve al
  // revés porque la tabla muestra primero lo último que pasó.
  const cronologico = [...cargos, ...abonos].sort(
    (a, b) => a.fecha.localeCompare(b.fecha) || (a.tipo === 'cargo' ? -1 : 1),
  )

  let saldo = 0
  const conSaldo = cronologico.map((movimiento) => {
    saldo = Math.round((saldo + (movimiento.tipo === 'cargo' ? movimiento.monto : -movimiento.monto)) * 100) / 100
    return { ...movimiento, saldo }
  })

  res.status(200).json({
    movimientos: conSaldo.reverse(),
    saldoActual: estado.saldoPendiente,
  })
})

// GET /api/pagos/proyecciones
export const proyeccionesFinancieras = asyncHandler(async (req, res) => {
  const meses = req.query.meses ? validarId(req.query.meses, 'número de meses') : 3
  res.status(200).json(await proyecciones({ meses: Math.min(meses, 12) }))
})

// POST /api/pagos/cuotas — alta de cuota (sólo administración).
export const registrarCuota = asyncHandler(async (req, res) => {
  requerirCampos(req.body, ['usuarioId', 'periodo', 'concepto', 'monto', 'venceEn'])

  const usuarioId = validarId(req.body.usuarioId, 'id del usuario')
  if (!(await buscarUsuarioPorId(usuarioId))) throw errorNoEncontrado('Usuario no encontrado.')

  if (!/^\d{4}-\d{2}$/.test(req.body.periodo)) {
    throw errorPeticion('El periodo debe tener el formato AAAA-MM.')
  }

  const cuota = await crearCuota({
    usuarioId,
    periodo: req.body.periodo,
    concepto: req.body.concepto.trim(),
    monto: validarMonto(req.body.monto),
    venceEn: validarFecha(req.body.venceEn, 'fecha de vencimiento'),
  })

  res.status(201).json(cuota)
})
