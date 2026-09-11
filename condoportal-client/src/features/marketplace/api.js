// Sprint 4 — API del marketplace de negocios y proveedores.
import { apiGet, apiPost, conQuery } from '../../shared/services/apiClient'

export const getNegocios = (filtros = {}, opciones) =>
  apiGet(conQuery('/marketplace/negocios', filtros), opciones)

export const getCategorias = (opciones) => apiGet('/marketplace/categorias', opciones)

export const getNegocio = (id, opciones) => apiGet(`/marketplace/negocios/${id}`, opciones)

export const publicarResena = (negocioId, resena) =>
  apiPost(`/marketplace/negocios/${negocioId}/resenas`, resena)
