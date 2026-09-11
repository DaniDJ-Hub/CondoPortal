// Sprint 1 — Backend 2: CRUD de gastos y filtro por categoría.
import { apiGet, apiPost, apiPut, apiDelete, conQuery } from '../../shared/services/apiClient'

export const getGastos = (filtros = {}, opciones) => apiGet(conQuery('/gastos', filtros), opciones)
export const getCategorias = (opciones) => apiGet('/gastos/categorias', opciones)
export const crearGasto = (gasto) => apiPost('/gastos', gasto)
export const actualizarGasto = (id, cambios) => apiPut(`/gastos/${id}`, cambios)
export const eliminarGasto = (id) => apiDelete(`/gastos/${id}`)
