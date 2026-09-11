// Sprint 4 — Full-Stack/QA: "Mapa interactivo" y "Puntos de interés cercanos".

import { useCallback, useState } from 'react'
import { useApi } from '../../shared/hooks/useApi'
import { getPuntosDeInteres } from './api'
import MapaInteractivo from './components/MapaInteractivo'
import { Contenido, SinDatos } from '../../shared/components/Estados'

const RADIOS = [
  { valor: '', etiqueta: 'Sin límite' },
  { valor: '200', etiqueta: 'Dentro del condominio (200 m)' },
  { valor: '500', etiqueta: 'A 500 m' },
  { valor: '1000', etiqueta: 'A 1 km' },
]

const fmtDistancia = (metros) =>
  metros === 0 ? 'En el acceso' : metros < 1000 ? `A ${metros} m` : `A ${(metros / 1000).toFixed(1)} km`

function MapaPage() {
  const [categoria, setCategoria] = useState('todos')
  const [radio, setRadio] = useState('')
  const [seleccionado, setSeleccionado] = useState(null)

  const cargar = useCallback(({ señal }) => getPuntosDeInteres({ categoria, radio }, { señal }), [categoria, radio])
  const { datos, cargando, error, recargar } = useApi(cargar, [categoria, radio])

  const puntos = datos?.puntos ?? []
  const categorias = datos?.categorias ?? []

  // Si un filtro deja fuera el punto abierto, se cierra su ficha en vez de
  // mostrar información que ya no está en el plano.
  const fichaVisible = seleccionado && puntos.some((p) => p.id === seleccionado.id) ? seleccionado : null

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <h1 className="titulo">Mapa del condominio</h1>
          <p className="sub">Amenidades, servicios y puntos de interés cercanos.</p>
        </div>
      </header>

      <div className="panel">
        <form className="filtros" aria-label="Filtros del mapa" onSubmit={(e) => e.preventDefault()}>
          <div className="filtros__grupo">
            <div className="filtros__campo">
              <label htmlFor="mapa-radio">Distancia</label>
              <select id="mapa-radio" value={radio} onChange={(e) => setRadio(e.target.value)}>
                {RADIOS.map((opcion) => (
                  <option key={opcion.etiqueta} value={opcion.valor}>{opcion.etiqueta}</option>
                ))}
              </select>
            </div>
          </div>
        </form>

        <div className="chips" role="group" aria-label="Filtrar por tipo de punto">
          <button
            type="button"
            className={`chip${categoria === 'todos' ? ' chip--activo' : ''}`}
            onClick={() => setCategoria('todos')}
            aria-pressed={categoria === 'todos'}
          >
            Todos
          </button>
          {categorias.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              className={`chip${categoria === opcion.valor ? ' chip--activo' : ''}`}
              onClick={() => setCategoria(opcion.valor)}
              aria-pressed={categoria === opcion.valor}
            >
              <span aria-hidden="true">{opcion.emblema}</span> {opcion.etiqueta}
            </button>
          ))}
        </div>

        <Contenido
          cargando={cargando}
          error={error}
          onReintentar={recargar}
          filasCarga={5}
          vacio={
            puntos.length === 0 ? (
              <SinDatos
                titulo="Sin puntos que mostrar"
                texto="Amplía la distancia o cambia de categoría para ver más lugares."
              />
            ) : null
          }
        >
          <div className="mapa-layout">
            <MapaInteractivo puntos={puntos} seleccionado={fichaVisible} onSeleccionar={setSeleccionado} />

            <aside className="mapa-lista" aria-label="Puntos de interés">
              {fichaVisible && (
                <div className="ficha-punto" role="status">
                  <span className="ficha-punto__emblema" aria-hidden="true">{fichaVisible.emblema}</span>
                  <h2 className="ficha-punto__nombre">{fichaVisible.nombre}</h2>
                  <p className="ficha-punto__categoria">
                    {fichaVisible.etiquetaCategoria} · {fmtDistancia(fichaVisible.distanciaM)}
                  </p>
                  <p className="ficha-punto__descripcion">{fichaVisible.descripcion}</p>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => setSeleccionado(null)}>
                    Cerrar
                  </button>
                </div>
              )}

              <h2 className="subtitulo">
                {puntos.length} {puntos.length === 1 ? 'lugar' : 'lugares'}
              </h2>
              <ul className="lista-puntos">
                {puntos.map((punto) => (
                  <li key={punto.id}>
                    <button
                      type="button"
                      className={`lista-puntos__item${fichaVisible?.id === punto.id ? ' es-activo' : ''}`}
                      onClick={() => setSeleccionado(fichaVisible?.id === punto.id ? null : punto)}
                      aria-pressed={fichaVisible?.id === punto.id}
                    >
                      <span className="lista-puntos__emblema" aria-hidden="true">{punto.emblema}</span>
                      <span className="lista-puntos__texto">
                        <span className="lista-puntos__nombre">{punto.nombre}</span>
                        <span className="lista-puntos__meta">{fmtDistancia(punto.distanciaM)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </Contenido>
      </div>
    </div>
  )
}

export default MapaPage
