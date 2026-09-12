// Sprint 1 — Backend 2: "CRUD de gastos" y "Filtro de gastos por categoría"
// vistos desde el cliente.

import { useCallback, useState } from 'react'
import { useApi } from '../../shared/hooks/useApi'
import { useAuth } from '../auth/hooks/useAuth'
import { useToast } from '../../shared/hooks/useToast'
import { getGastos, getCategorias, eliminarGasto } from './api'
import GastosList from './components/GastosList'
import FormularioGasto from './components/FormularioGasto'
import { fmtMoneda } from '../../shared/utils/formato'
import imagenGastos from '../../assets/img/gastos.jpg'

const FILTROS_INICIALES = { categoria: 'todos', desde: '', hasta: '' }

function GastosPage() {
  const { esAdmin } = useAuth()
  const toast = useToast()

  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [formulario, setFormulario] = useState(null) // null | 'nuevo' | gasto

  const cargarGastos = useCallback(({ señal }) => getGastos(filtros, { señal }), [filtros])
  const { datos, cargando, error, recargar } = useApi(cargarGastos, [filtros])
  const { datos: catalogo } = useApi(({ señal }) => getCategorias({ señal }), [])

  const categorias = catalogo?.categorias ?? []
  const etiquetas = Object.fromEntries(categorias.map((c) => [c.valor, c.etiqueta]))
  const hayFiltros = filtros.categoria !== 'todos' || filtros.desde !== '' || filtros.hasta !== ''

  const actualizar = (campo) => (evento) =>
    setFiltros((previos) => ({ ...previos, [campo]: evento.target.value }))

  async function confirmarEliminar(gasto) {
    // Un borrado no se deshace: se confirma antes de llamar a la API.
    if (!window.confirm(`¿Eliminar "${gasto.descripcion}" por ${fmtMoneda(gasto.monto)}?`)) return

    try {
      await eliminarGasto(gasto.id)
      toast.exito('Gasto eliminado.')
      recargar()
    } catch (fallo) {
      toast.desdeError(fallo, 'No se pudo eliminar el gasto.')
    }
  }

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <p className="eyebrow">Administración financiera</p>
          <h1 className="titulo">Gastos</h1>
          <p className="sub">En qué se invierte la cuota de mantenimiento.</p>
        </div>
        {esAdmin && (
          <button type="button" className="btn btn--primary" onClick={() => setFormulario('nuevo')}>
            Registrar gasto
          </button>
        )}
      </header>

      {/* Banda de presentación del diseño de Frontend 1. */}
      <section className="destacado" aria-labelledby="gastos-destacado">
        <div className="destacado__marco">
          <img src={imagenGastos} alt="" />
        </div>
        <div>
          <p className="eyebrow">Resumen visual</p>
          <h2 id="gastos-destacado" className="destacado__titulo">Mantén tus gastos bajo control</h2>
          <p className="sub">
            Filtra por categoría y periodo para ver con claridad en qué se va la cuota
            de mantenimiento del conjunto.
          </p>
        </div>
      </section>

      <div className="panel">
        <form className="filtros" role="search" aria-label="Filtros de gastos" onSubmit={(e) => e.preventDefault()}>
          <div className="filtros__grupo">
            <div className="filtros__campo">
              <label htmlFor="gastos-categoria">Categoría</label>
              <select id="gastos-categoria" value={filtros.categoria} onChange={actualizar('categoria')}>
                <option value="todos">Todas</option>
                {categorias.map((categoria) => (
                  <option key={categoria.valor} value={categoria.valor}>{categoria.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="filtros__campo">
              <label htmlFor="gastos-desde">Desde</label>
              <input id="gastos-desde" type="date" value={filtros.desde} onChange={actualizar('desde')} />
            </div>
            <div className="filtros__campo">
              <label htmlFor="gastos-hasta">Hasta</label>
              <input id="gastos-hasta" type="date" value={filtros.hasta} onChange={actualizar('hasta')} />
            </div>
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

        {!cargando && !error && datos && (
          <p className="historial__resumen" aria-live="polite">
            {datos.cantidad} {datos.cantidad === 1 ? 'gasto' : 'gastos'} · {fmtMoneda(datos.total)} en total
          </p>
        )}

        <GastosList
          gastos={datos?.gastos ?? []}
          etiquetas={etiquetas}
          cargando={cargando}
          error={error}
          onReintentar={recargar}
          puedeEditar={esAdmin}
          onEditar={setFormulario}
          onEliminar={confirmarEliminar}
          hayFiltros={hayFiltros}
          onLimpiar={() => setFiltros(FILTROS_INICIALES)}
        />
      </div>

      {formulario && (
        <FormularioGasto
          gasto={formulario === 'nuevo' ? null : formulario}
          categorias={categorias}
          onCerrar={() => setFormulario(null)}
          onGuardado={() => {
            setFormulario(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}

export default GastosPage
