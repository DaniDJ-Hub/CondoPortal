// Sprint 3 — Full-Stack/QA: feed de actividad reciente.
//
// Une en una sola línea de tiempo lo que pasa en el condominio: pagos de
// residentes, gastos de la administración, altas de vecinos y negocios nuevos
// en el marketplace.

import { useState } from 'react'
import { fmtMoneda, fmtRelativo, fmtFechaLarga } from '../../../shared/utils/formato'
import { Contenido, SinDatos } from '../../../shared/components/Estados'

const CONFIG_TIPO = {
  pago: { etiqueta: 'Pago', icono: '💳', clase: 'act--pago' },
  gasto: { etiqueta: 'Gasto', icono: '🧾', clase: 'act--gasto' },
  usuario: { etiqueta: 'Vecino', icono: '👋', clase: 'act--usuario' },
  negocio: { etiqueta: 'Marketplace', icono: '🏪', clase: 'act--negocio' },
}

const FILTROS = [
  { valor: 'todos', etiqueta: 'Todo' },
  { valor: 'pago', etiqueta: 'Pagos' },
  { valor: 'gasto', etiqueta: 'Gastos' },
  { valor: 'usuario', etiqueta: 'Vecinos' },
  { valor: 'negocio', etiqueta: 'Marketplace' },
]

function Monto({ monto, signo }) {
  if (monto === null || monto === undefined) return null
  const clase = signo > 0 ? 'es-ingreso' : signo < 0 ? 'es-egreso' : ''
  const prefijo = signo > 0 ? '+ ' : signo < 0 ? '− ' : ''
  return (
    <span className={`act__monto ${clase}`}>
      {prefijo}
      {fmtMoneda(monto)}
    </span>
  )
}

function ActividadReciente({ actividad = [], cargando, error, onReintentar }) {
  const [filtro, setFiltro] = useState('todos')

  const visibles = filtro === 'todos' ? actividad : actividad.filter((evento) => evento.tipo === filtro)

  return (
    <section className="seccion panel" aria-labelledby="actividad-titulo">
      <header className="seccion__cabecera seccion__cabecera--fila">
        <div>
          <h2 id="actividad-titulo" className="seccion__titulo">Actividad reciente</h2>
          <p className="seccion__sub">Lo último que ha pasado en el condominio.</p>
        </div>

        <div className="chips" role="group" aria-label="Filtrar actividad por tipo">
          {FILTROS.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              className={`chip${filtro === opcion.valor ? ' chip--activo' : ''}`}
              onClick={() => setFiltro(opcion.valor)}
              aria-pressed={filtro === opcion.valor}
            >
              {opcion.etiqueta}
            </button>
          ))}
        </div>
      </header>

      <Contenido
        cargando={cargando}
        error={error}
        onReintentar={onReintentar}
        filasCarga={5}
        vacio={
          visibles.length === 0 ? (
            <SinDatos
              titulo={filtro === 'todos' ? 'Aún no hay actividad' : 'Sin actividad de este tipo'}
              texto={
                filtro === 'todos'
                  ? 'Los pagos, gastos y altas aparecerán aquí conforme ocurran.'
                  : 'Prueba con otro filtro para ver el resto de los movimientos.'
              }
              accion={
                filtro !== 'todos' && (
                  <button type="button" className="btn btn--ghost" onClick={() => setFiltro('todos')}>
                    Ver todo
                  </button>
                )
              }
            />
          ) : null
        }
      >
        <ol className="actividad">
          {visibles.map((evento) => {
            const config = CONFIG_TIPO[evento.tipo] ?? CONFIG_TIPO.gasto
            return (
              <li key={evento.id} className={`act ${config.clase}`}>
                <span className="act__icono" aria-hidden="true">{config.icono}</span>

                <div className="act__cuerpo">
                  <p className="act__titulo">{evento.titulo}</p>
                  <p className="act__meta">
                    <span className="act__tipo">{config.etiqueta}</span>
                    {evento.detalle && <> · {evento.detalle}</>}
                  </p>
                </div>

                <div className="act__lado">
                  <Monto monto={evento.monto} signo={evento.signo} />
                  <time className="act__fecha" dateTime={evento.fecha} title={fmtFechaLarga(evento.fecha)}>
                    {fmtRelativo(evento.fecha)}
                  </time>
                </div>
              </li>
            )
          })}
        </ol>
      </Contenido>
    </section>
  )
}

export default ActividadReciente
