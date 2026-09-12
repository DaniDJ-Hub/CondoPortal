// Sprint 4 — Frontend 1: grid de negocios del marketplace.

import { useCallback, useState } from 'react'
import { useApi } from '../../shared/hooks/useApi'
import { getNegocios, getCategorias } from './api'
import NegocioCard from './components/NegocioCard'
import { Contenido, SinDatos } from '../../shared/components/Estados'
import Stack from '../../shared/components/Stack'
import imagen1 from '../../assets/img/imagen1.jpg'
import imagen2 from '../../assets/img/imagen2.jpg'
import imagen3 from '../../assets/img/imagen3.jpg'
import imagen4 from '../../assets/img/imagen4.jpg'
import imagen5 from '../../assets/img/imagen5.jpg'
import imagen6 from '../../assets/img/imagen6.jpg'
import imagen7 from '../../assets/img/imagen7.jpg'
import imagen8 from '../../assets/img/imagen8.jpg'

const FILTROS_INICIALES = { categoria: 'todos', busqueda: '', destacados: false }

// Fotos del carrusel de portada (Frontend 1). Se arman fuera del componente
// para que `Stack` no rehaga el montón en cada render.
const FOTOS = [imagen1, imagen2, imagen3, imagen4, imagen5, imagen6, imagen7, imagen8]
const TARJETAS = FOTOS.map((src, indice) => (
  <img key={src} src={src} alt={`Servicio destacado ${indice + 1}`} className="card-image" />
))

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
          <p className="eyebrow">Servicios para tu comunidad</p>
          <h1 className="titulo">Marketplace</h1>
          <p className="sub">Negocios y servicios de tus vecinos y del barrio.</p>
        </div>
      </header>

      {/* Portada de Frontend 1: la baraja de fotos se arrastra o se pulsa para
          pasar a la siguiente. Es decorativa; el directorio real va debajo. */}
      <section className="destacado destacado--portada" aria-labelledby="mkt-destacado">
        <div>
          <p className="eyebrow">Proveedores destacados</p>
          <h2 id="mkt-destacado" className="destacado__titulo">Servicios para tu conjunto</h2>
          <p className="sub">
            Mantenimiento, hogar y bienestar, con la recomendación de quienes ya
            los contrataron.
          </p>
        </div>
        <div className="destacado__baraja" aria-hidden="true">
          <Stack cards={TARJETAS} sendToBackOnClick mobileClickOnly />
        </div>
      </section>

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
