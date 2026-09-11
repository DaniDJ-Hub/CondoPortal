// Contexto de notificaciones. El componente proveedor vive en
// `shared/components/ToastProvider.jsx`; aquí queda el acceso, sin JSX, para
// que importarlo desde un hook no arrastre un componente.

import { createContext, useContext } from 'react'

export const ContextoToast = createContext(null)

export function useToast() {
  const contexto = useContext(ContextoToast)
  if (!contexto) throw new Error('useToast debe usarse dentro de <ToastProvider>.')
  return contexto
}
