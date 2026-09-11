// Sprint 1 — Backend 2: manejo de sesión (token/logout).
//
// Contexto de sesión y hook de acceso. El componente proveedor vive en
// `features/auth/AuthProvider.jsx` porque este archivo no lleva JSX.

import { createContext, useContext } from 'react'

export const ContextoAuth = createContext(null)

export function useAuth() {
  const contexto = useContext(ContextoAuth)
  if (!contexto) throw new Error('useAuth debe usarse dentro de <AuthProvider>.')
  return contexto
}
