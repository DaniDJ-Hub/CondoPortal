// Sprint 5 — Frontend 1: componente de notificaciones toast.
//
// Presentación pura: recibe el mensaje ya resuelto y avisa cuándo cerrarlo.
// La cola y el disparo desde eventos reales viven en ToastProvider.

import { useEffect, useRef } from 'react'

const ICONOS = {
  exito: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  error: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5M12 16h.01" />
    </>
  ),
  aviso: (
    <>
      <path d="M12 4.5 21 19H3z" />
      <path d="M12 10v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </>
  ),
}

function Toast({ id, mensaje, titulo, tipo = 'info', duracion = 5000, onCerrar }) {
  const temporizador = useRef(null)

  // Con duracion=0 el aviso se queda hasta que la persona lo cierre; lo usamos
  // para los errores que exigen una acción.
  useEffect(() => {
    if (!duracion) return undefined
    temporizador.current = setTimeout(() => onCerrar(id), duracion)
    return () => clearTimeout(temporizador.current)
  }, [id, duracion, onCerrar])

  // Al pasar el puntero por encima se congela la cuenta atrás: da tiempo de
  // leer un mensaje largo sin que desaparezca a media lectura.
  function pausar() {
    if (temporizador.current) clearTimeout(temporizador.current)
  }

  function reanudar() {
    if (!duracion) return
    temporizador.current = setTimeout(() => onCerrar(id), duracion)
  }

  return (
    <div
      className={`toast toast--${tipo}`}
      role={tipo === 'error' ? 'alert' : 'status'}
      onMouseEnter={pausar}
      onMouseLeave={reanudar}
      onFocus={pausar}
      onBlur={reanudar}
    >
      <svg
        className="toast__icono"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICONOS[tipo] ?? ICONOS.info}
      </svg>

      <div className="toast__cuerpo">
        {titulo && <p className="toast__titulo">{titulo}</p>}
        <p className="toast__mensaje">{mensaje}</p>
      </div>

      <button type="button" className="toast__cerrar" onClick={() => onCerrar(id)} aria-label="Cerrar notificación">
        <svg width="14" height="14" viewBox="0 0 16 16" aria-hidden="true" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="m4 4 8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  )
}

export default Toast
