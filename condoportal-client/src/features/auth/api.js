// Sprint 1 — Backend 1: endpoint de autenticación.
// Sprint 1 — Backend 2: manejo de sesión (token/logout).
// Sprint 4 — Backend 1: registro de nuevos usuarios.
import { apiGet, apiPost } from '../../shared/services/apiClient'

export const login = (email, password) => apiPost('/auth/login', { email, password })
export const registro = (datos) => apiPost('/auth/registro', datos)
export const sesionActual = () => apiGet('/auth/me')
export const renovarSesion = () => apiPost('/auth/renovar')
export const logout = () => apiPost('/auth/logout')
