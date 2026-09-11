// Sprint 4 — Full-Stack/QA: puntos de interés cercanos.
import { apiGet, conQuery } from '../../shared/services/apiClient'

export const getPuntosDeInteres = (filtros = {}, opciones) =>
  apiGet(conQuery('/mapa/puntos-interes', filtros), opciones)

export const getPunto = (id, opciones) => apiGet(`/mapa/puntos-interes/${id}`, opciones)
