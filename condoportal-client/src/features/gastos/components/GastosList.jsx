// Sprint 1 — tabla de gastos del condominio.

import { fmtMoneda, fmtFecha } from '../../../shared/utils/formato'
import { Contenido, SinDatos } from '../../../shared/components/Estados'

function GastosList({ gastos = [], etiquetas = {}, cargando, error, onReintentar, onEditar, onEliminar, puedeEditar, hayFiltros, onLimpiar }) {
  return (
    <Contenido
      cargando={cargando}
      error={error}
      onReintentar={onReintentar}
      filasCarga={6}
      vacio={
        gastos.length === 0 ? (
          <SinDatos
            titulo={hayFiltros ? 'Sin resultados' : 'Aún no hay gastos registrados'}
            texto={
              hayFiltros
                ? 'Ningún gasto coincide con los filtros seleccionados.'
                : 'Los gastos del condominio aparecerán aquí conforme se registren.'
            }
            accion={
              hayFiltros && (
                <button type="button" className="btn btn--ghost" onClick={onLimpiar}>
                  Limpiar filtros
                </button>
              )
            }
          />
        ) : null
      }
    >
      <div className="table-container">
        <table className="table">
          <caption className="sr-only">Gastos del condominio, del más reciente al más antiguo.</caption>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Descripción</th>
              <th scope="col">Categoría</th>
              <th scope="col" className="celda--numero">Monto</th>
              {puedeEditar && <th scope="col"><span className="sr-only">Acciones</span></th>}
            </tr>
          </thead>
          <tbody>
            {gastos.map((gasto) => (
              <tr key={gasto.id}>
                <td data-label="Fecha">{fmtFecha(gasto.fecha)}</td>
                <td data-label="Descripción">
                  <span className="celda__principal">{gasto.descripcion}</span>
                  {gasto.proveedor && <small className="celda__nota">{gasto.proveedor}</small>}
                </td>
                <td data-label="Categoría">
                  <span className={`etiqueta etiqueta--${gasto.categoria}`}>
                    {etiquetas[gasto.categoria] ?? gasto.categoria}
                  </span>
                </td>
                <td data-label="Monto" className="celda--numero">{fmtMoneda(gasto.monto)}</td>
                {puedeEditar && (
                  <td data-label="Acciones">
                    <div className="acciones-fila">
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => onEditar(gasto)}>
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm btn--peligro"
                        onClick={() => onEliminar(gasto)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Contenido>
  )
}

export default GastosList
