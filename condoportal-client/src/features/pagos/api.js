// Sprint 2 — estado de cuenta, flujo de pago, recibo y movimientos.
import { apiGet, apiPost, conQuery } from '../../shared/services/apiClient'

export const getEstadoCuenta = (usuarioId, opciones) =>
  apiGet(usuarioId ? `/pagos/estado-cuenta/${usuarioId}` : '/pagos/estado-cuenta', opciones)

export const getMovimientos = (usuarioId, opciones) =>
  apiGet(conQuery('/pagos/movimientos', { usuarioId }), opciones)

export const pagarCuota = (datosPago) => apiPost('/pagos/pagar', datosPago)

export const getRecibo = (pagoId, opciones) => apiGet(`/pagos/${pagoId}/recibo`, opciones)

export const getProyecciones = (meses = 3, opciones) =>
  apiGet(conQuery('/pagos/proyecciones', { meses }), opciones)
