// Sprint 4 — Frontend 1: grid de negocios del marketplace.

import { useCallback, useState } from 'react'
import { useApi } from '../../shared/hooks/useApi'
import { getNegocios, getCategorias } from './api'
import NegocioCard from './components/NegocioCard'
import { Contenido, SinDatos } from '../../shared/components/Estados'

const FILTROS_INICIALES = { categoria: 'todos', busqueda: '', destacados: false }

function MarketplacePage() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)

  const cargar = useCallback(
    ({ señal }) =>
      getNegocios(
        {
          categoria: filtros.categoria,
          busqueda: filtros.busqueda.trim(),
          destacados: filtros.destacados ? 'true' : '',
        },
        { señal },
      ),
    [filtros],
  )

  const { datos, cargando, error, recargar } = useApi(cargar, [filtros])
  const { datos: catalogo } = useApi(({ señal }) => getCategorias({ señal }), [])

  const categorias = catalogo?.resumen ?? []
  const hayFiltros = filtros.categoria !== 'todos' || filtros.busqueda !== '' || filtros.destacados

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <h1 className="titulo">Marketplace</h1>
          <p className="sub">Negocios y servicios de tus vecinos y del barrio.</p>
        </div>
      </header>

      <div className="panel">
        <form className="filtros" role="search" aria-label="Buscar negocios" onSubmit={(e) => e.preventDefault()}>
          <div className="filtros__grupo">
            <div className="filtros__campo filtros__campo--busqueda">
              <label htmlFor="mkt-busqueda">Buscar</label>
              <input
                id="mkt-busqueda"
                type="search"
                placeholder="Nombre o servicio…"
                value={filtros.busqueda}
                onChange={(e) => setFiltros((p) => ({ ...p, busqueda: e.target.value }))}
              />
            </div>

            <label className="filtros__check">
              <input
                type="checkbox"
                checked={filtros.destacados}
                onChange={(e) => setFiltros((p) => ({ ...p, destacados: e.target.checked }))}
              />
              Sólo destacados
            </label>

            <button
              type="button"
              className="btn btn--ghost filtros__limpiar"
              onClick={() => setFiltros(FILTROS_INICIALES)}
              disabled={!hayFiltros}
            >
              Limpiar filtros
            </button>
          </div>
        </form>

        <div className="chips" role="group" aria-label="Filtrar por categoría">
          <button
            type="button"
            className={`chip${filtros.categoria === 'todos' ? ' chip--activo' : ''}`}
            onClick={() => setFiltros((p) => ({ ...p, categoria: 'todos' }))}
            aria-pressed={filtros.categoria === 'todos'}
          >
            Todas
          </button>
          {categorias.map((categoria) => (
            <button
              key={categoria.valor}
              type="button"
              className={`chip${filtros.categoria === categoria.valor ? ' chip--activo' : ''}`}
              onClick={() => setFiltros((p) => ({ ...p, categoria: categoria.valor }))}
              aria-pressed={filtros.categoria === categoria.valor}
            >
              {categoria.etiqueta} <span className="chip__conteo">{categoria.cantidad}</span>
            </button>
          ))}
        </div>

        <Contenido
          cargando={cargando}
          error={error}
          onReintentar={recargar}
          filasCarga={6}
          vacio={
            datos?.cantidad === 0 ? (
              <SinDatos
                titulo="Sin resultados"
                texto="Ningún negocio coincide con lo que buscas."
                accion={
                  hayFiltros && (
                    <button type="button" className="btn btn--ghost" onClick={() => setFiltros(FILTROS_INICIALES)}>
                      Limpiar filtros
                    </button>
                  )
                }
              />
            ) : null
          }
        >
          <>
            <p className="historial__resumen" aria-live="polite">
              {datos?.cantidad} {datos?.cantidad === 1 ? 'negocio' : 'negocios'}
            </p>
            <div className="negocio-grid">
              {datos?.negocios.map((negocio) => (
                <NegocioCard key={negocio.id} negocio={negocio} />
              ))}
            </div>
          </>
        </Contenido>
      </div>
    </div>
  )
}

export default MarketplacePage
