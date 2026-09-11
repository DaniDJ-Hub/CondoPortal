// Sprint 5 — Backend 1: gestión de usuarios y roles.
import { apiGet, apiPost, apiPut, apiPatch, apiDelete, conQuery } from '../../shared/services/apiClient'

export const getResumen = (opciones) => apiGet('/admin/resumen', opciones)
export const getUsuarios = (filtros = {}, opciones) => apiGet(conQuery('/admin/usuarios', filtros), opciones)
export const crearUsuario = (datos) => apiPost('/admin/usuarios', datos)
export const actualizarUsuario = (id, cambios) => apiPut(`/admin/usuarios/${id}`, cambios)
export const actualizarRol = (usuarioId, rol) => apiPatch(`/admin/usuarios/${usuarioId}/rol`, { rol })
export const desactivarUsuario = (id) => apiDelete(`/admin/usuarios/${id}`)
