// Sprint 3 — endpoints que alimentan el dashboard.
import { apiGet, conQuery } from '../../shared/services/apiClient'

export const getResumen = (meses = 6, opciones) => apiGet(conQuery('/dashboard', { meses }), opciones)
export const getKpis = (opciones) => apiGet('/dashboard/kpis', opciones)
export const getFlujoDeCaja = (meses = 6, opciones) =>
  apiGet(conQuery('/dashboard/flujo-caja', { meses }), opciones)
export const getActividad = (limite = 12, opciones) =>
  apiGet(conQuery('/dashboard/actividad', { limite }), opciones)
