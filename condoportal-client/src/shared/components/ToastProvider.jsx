// Sprint 5 — Full-Stack/QA: "Conectar toasts a eventos reales de la app".
//
// Mantiene la cola de avisos y la expone por contexto, de modo que cualquier
// vista dispare una notificación con `toast.exito(...)` tras un pago, un
// cambio de rol o un error de la API, sin pasar props por medio proyecto.

import { useCallback, useMemo, useRef, useState } from 'react'
import Toast from './Toast'
import { ContextoToast } from '../hooks/useToast'

const MAXIMO_VISIBLES = 4

export function ToastProvider({ children }) {
  const [avisos, setAvisos] = useState([])
  const siguienteId = useRef(1)

  const cerrar = useCallback((id) => {
    setAvisos((previos) => previos.filter((aviso) => aviso.id !== id))
  }, [])

  const mostrar = useCallback((aviso) => {
    const id = siguienteId.current++
    // Nos quedamos con los más recientes: una ráfaga de errores no debe
    // tapar la pantalla completa.
    setAvisos((previos) => [...previos, { id, ...aviso }].slice(-MAXIMO_VISIBLES))
    return id
  }, [])

  const api = useMemo(
    () => ({
      mostrar,
      cerrar,
      exito: (mensaje, opciones) => mostrar({ tipo: 'exito', mensaje, ...opciones }),
      error: (mensaje, opciones) => mostrar({ tipo: 'error', mensaje, duracion: 8000, ...opciones }),
      aviso: (mensaje, opciones) => mostrar({ tipo: 'aviso', mensaje, ...opciones }),
      info: (mensaje, opciones) => mostrar({ tipo: 'info', mensaje, ...opciones }),
      // Atajo para los catch: usa el mensaje que mandó el servidor si lo hay.
      desdeError: (error, alternativo = 'Ocurrió un error inesperado.') =>
        mostrar({ tipo: 'error', mensaje: error?.message || alternativo, duracion: 8000 }),
    }),
    [mostrar, cerrar],
  )

  return (
    <ContextoToast.Provider value={api}>
      {children}
      <div className="toast-pila" aria-live="polite" aria-relevant="additions text">
        {avisos.map((aviso) => (
          <Toast key={aviso.id} {...aviso} onCerrar={cerrar} />
        ))}
      </div>
    </ContextoToast.Provider>
  )
}
