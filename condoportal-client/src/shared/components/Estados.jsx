// Estados de interfaz reutilizables: carga, error y vacío.
//
// Unifican el aspecto de las vistas para que un dashboard cargando y un
// marketplace cargando se vean igual, sin repetir el marcado en cada feature.

export function Cargando({ texto = 'Cargando…', filas = 3 }) {
  return (
    <div className="estado estado--cargando" aria-busy="true">
      <span className="sr-only">{texto}</span>
      {Array.from({ length: filas }).map((_, i) => (
        <span key={i} className="skeleton-barra" aria-hidden="true" />
      ))}
    </div>
  )
}

export function ErrorCarga({ error, onReintentar, titulo = 'No se pudo cargar la información' }) {
  return (
    <div className="estado estado--error" role="alert">
      <svg width="48" height="48" viewBox="0 0 24 24" aria-hidden="true" fill="none"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      <p className="estado__titulo">{titulo}</p>
      <p className="estado__texto">{error?.message || 'Revisa tu conexión e inténtalo de nuevo.'}</p>
      {onReintentar && (
        <button type="button" className="btn btn--primary" onClick={onReintentar}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export function SinDatos({ titulo = 'Nada por aquí todavía', texto, accion }) {
  return (
    <div className="estado estado--vacio">
      <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden="true" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
      <p className="estado__titulo">{titulo}</p>
      {texto && <p className="estado__texto">{texto}</p>}
      {accion}
    </div>
  )
}

// Envoltura que resuelve el trío cargando / error / contenido en una línea,
// para no repetir el mismo ternario anidado en cada vista.
export function Contenido({ cargando, error, onReintentar, vacio, children, filasCarga = 3 }) {
  if (cargando) return <Cargando filas={filasCarga} />
  if (error) return <ErrorCarga error={error} onReintentar={onReintentar} />
  if (vacio) return vacio
  return children
}
