// Sprint 3 — desglose de egresos por rubro que acompaña a los KPIs.
//
// Barras horizontales en vez de un pastel: con cinco categorías es más fácil
// comparar longitudes que ángulos, y el porcentaje queda escrito.

import { fmtMoneda, fmtPorcentaje } from '../../../shared/utils/formato'
import { Contenido, SinDatos } from '../../../shared/components/Estados'

function GastosPorCategoria({ categorias = [], cargando, error, onReintentar }) {
  return (
    <section className="seccion panel" aria-labelledby="categorias-titulo">
      <header className="seccion__cabecera">
        <h2 id="categorias-titulo" className="seccion__titulo">Egresos por rubro</h2>
        <p className="seccion__sub">En qué se ha ido el gasto del condominio.</p>
      </header>

      <Contenido
        cargando={cargando}
        error={error}
        onReintentar={onReintentar}
        filasCarga={4}
        vacio={categorias.length === 0 ? <SinDatos titulo="Todavía no hay gastos registrados" /> : null}
      >
        <ul className="desglose">
          {categorias.map((fila) => (
            <li key={fila.categoria} className="desglose__fila">
              <div className="desglose__cabecera">
                <span className="desglose__etiqueta">{fila.etiqueta}</span>
                <span className="desglose__valor">{fmtMoneda(fila.total)}</span>
              </div>
              <div
                className="desglose__barra"
                role="img"
                aria-label={`${fila.etiqueta}: ${fmtMoneda(fila.total)}, ${fmtPorcentaje(fila.porcentaje)} del total`}
              >
                <span className={`desglose__relleno desglose__relleno--${fila.categoria}`} style={{ width: `${fila.porcentaje}%` }} />
              </div>
              <p className="desglose__pie">
                {fmtPorcentaje(fila.porcentaje)} · {fila.cantidad} {fila.cantidad === 1 ? 'movimiento' : 'movimientos'}
              </p>
            </li>
          ))}
        </ul>
      </Contenido>
    </section>
  )
}

export default GastosPorCategoria
