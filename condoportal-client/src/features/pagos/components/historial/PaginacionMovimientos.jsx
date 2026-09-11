// Sprint 2 — Frontend 2: paginación del Historial de Movimientos.
// Paginación del lado del cliente sobre los movimientos ya filtrados.

function PaginacionMovimientos({ pagina, totalPaginas, onPagina }) {
  if (totalPaginas <= 1) return null

  return (
    <nav className="paginacion" aria-label="Paginación de movimientos">
      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => onPagina(pagina - 1)}
        disabled={pagina <= 1}
      >
        ‹ Anterior
      </button>

      <span className="paginacion__estado" aria-live="polite">
        Página {pagina} de {totalPaginas}
      </span>

      <button
        type="button"
        className="btn btn--ghost"
        onClick={() => onPagina(pagina + 1)}
        disabled={pagina >= totalPaginas}
      >
        Siguiente ›
      </button>
    </nav>
  )
}

export default PaginacionMovimientos
