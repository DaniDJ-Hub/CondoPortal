// Sprint 2 — Frontend 2: barra de filtros del Historial de Movimientos.

import { FILTROS_TIPO as TIPOS, FILTROS_ESTADO as ESTADOS } from '../../constantes'

const PERIODOS = [
  { valor: 'todo', etiqueta: 'Todo el historial' },
  { valor: '30d', etiqueta: 'Últimos 30 días' },
  { valor: '3m', etiqueta: 'Últimos 3 meses' },
  { valor: 'anio', etiqueta: 'Este año' },
]

function FiltrosMovimientos({ filtros, onCambio, onLimpiar, hayFiltrosActivos }) {
  const actualizar = (campo) => (e) => onCambio({ ...filtros, [campo]: e.target.value })

  return (
    <form
      className="filtros"
      role="search"
      aria-label="Filtros del historial"
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="filtros__grupo" role="group" aria-label="Filtros">
        <div className="filtros__campo filtros__campo--busqueda">
          <label htmlFor="filtro-busqueda">Buscar</label>
          <input
            id="filtro-busqueda"
            type="search"
            inputMode="search"
            placeholder="Concepto o folio…"
            value={filtros.busqueda}
            onChange={actualizar('busqueda')}
          />
        </div>

        <div className="filtros__campo">
          <label htmlFor="filtro-periodo">Periodo</label>
          <select id="filtro-periodo" value={filtros.periodo} onChange={actualizar('periodo')}>
            {PERIODOS.map((p) => (
              <option key={p.valor} value={p.valor}>{p.etiqueta}</option>
            ))}
          </select>
        </div>

        <div className="filtros__campo">
          <label htmlFor="filtro-tipo">Tipo</label>
          <select id="filtro-tipo" value={filtros.tipo} onChange={actualizar('tipo')}>
            {TIPOS.map((t) => (
              <option key={t.valor} value={t.valor}>{t.etiqueta}</option>
            ))}
          </select>
        </div>

        <div className="filtros__campo">
          <label htmlFor="filtro-estado">Estado</label>
          <select id="filtro-estado" value={filtros.estado} onChange={actualizar('estado')}>
            {ESTADOS.map((s) => (
              <option key={s.valor} value={s.valor}>{s.etiqueta}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn btn--ghost filtros__limpiar"
          onClick={onLimpiar}
          disabled={!hayFiltrosActivos}
        >
          Limpiar filtros
        </button>
      </div>
    </form>
  )
}

export default FiltrosMovimientos
