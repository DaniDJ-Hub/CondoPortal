// Sprint 2 — Frontend 2: estados de interfaz del Historial de Movimientos
// (carga con skeleton, error con reintento, y vacío / sin resultados).

const FILAS_SKELETON = 6
const CELDAS_SKELETON = 6

export function CargandoMovimientos() {
  return (
    <div className="hist-estado" aria-busy="true">
      <span className="sr-only">Cargando movimientos…</span>
      <table className="table table--historial" aria-hidden="true">
        <tbody>
          {Array.from({ length: FILAS_SKELETON }).map((_, fila) => (
            <tr key={fila} className="skeleton-fila">
              {Array.from({ length: CELDAS_SKELETON }).map((__, celda) => (
                <td key={celda}>
                  <span className="skeleton-barra" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ErrorMovimientos({ onReintentar }) {
  return (
    <div className="hist-estado hist-estado--error" role="alert">
      <svg width="56" height="56" viewBox="0 0 24 24" aria-hidden="true" fill="none"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" />
      </svg>
      <p className="hist-estado__titulo">No se pudo cargar el historial</p>
      <p className="hist-estado__texto">Revisa tu conexión e inténtalo de nuevo.</p>
      <button type="button" className="btn btn--primary" onClick={onReintentar}>
        Reintentar
      </button>
    </div>
  )
}

export function SinMovimientos({ conFiltros, onLimpiar }) {
  return (
    <div className="hist-estado hist-estado--vacio">
      <svg width="64" height="64" viewBox="0 0 24 24" aria-hidden="true" fill="none"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="M8 8h8M8 12h8M8 16h5" />
      </svg>
      <p className="hist-estado__titulo">
        {conFiltros ? 'Sin resultados' : 'Aún no hay movimientos'}
      </p>
      <p className="hist-estado__texto">
        {conFiltros
          ? 'Ningún movimiento coincide con los filtros seleccionados.'
          : 'Cuando se registren ingresos, egresos o pagos, aparecerán aquí.'}
      </p>
      {conFiltros && (
        <button type="button" className="btn btn--ghost" onClick={onLimpiar}>
          Limpiar filtros
        </button>
      )}
    </div>
  )
}
