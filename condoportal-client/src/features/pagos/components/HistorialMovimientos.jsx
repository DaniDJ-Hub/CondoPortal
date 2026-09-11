// Sprint 2 — Frontend 2: vista completa "Historial de Movimientos".
//
// Los datos llegan de `PagosPage`, que es quien los recarga tras un pago para
// que el estado de cuenta y el historial queden siempre sincronizados.

import { useMemo, useState } from 'react'
import FiltrosMovimientos from './historial/FiltrosMovimientos'
import TablaMovimientos from './historial/TablaMovimientos'
import PaginacionMovimientos from './historial/PaginacionMovimientos'
import {
  CargandoMovimientos,
  ErrorMovimientos,
  SinMovimientos,
} from './historial/EstadosMovimientos'

const FILTROS_INICIALES = {
  busqueda: '',
  periodo: 'todo',
  tipo: 'todos',
  estado: 'todos',
}

const POR_PAGINA = 8

function dentroDePeriodo(fechaISO, periodo) {
  if (periodo === 'todo') return true
  const fecha = new Date(`${fechaISO}T00:00:00`)
  const hoy = new Date()
  if (periodo === 'anio') return fecha.getFullYear() === hoy.getFullYear()
  const dias = periodo === '30d' ? 30 : 90
  const limite = new Date(hoy)
  limite.setDate(limite.getDate() - dias)
  return fecha >= limite
}

function HistorialMovimientos({ movimientos = [], cargando, error, onReintentar }) {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES)
  const [pagina, setPagina] = useState(1)

  const hayFiltrosActivos =
    filtros.busqueda.trim() !== '' ||
    filtros.periodo !== 'todo' ||
    filtros.tipo !== 'todos' ||
    filtros.estado !== 'todos'

  const filtrados = useMemo(() => {
    const q = filtros.busqueda.trim().toLowerCase()
    return movimientos.filter((mov) => {
      if (filtros.tipo !== 'todos' && mov.tipo !== filtros.tipo) return false
      if (filtros.estado !== 'todos' && mov.estado !== filtros.estado) return false
      if (!dentroDePeriodo(mov.fecha, filtros.periodo)) return false
      if (q && !`${mov.concepto} ${mov.id}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [movimientos, filtros])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const visibles = filtrados.slice(
    (paginaActual - 1) * POR_PAGINA,
    paginaActual * POR_PAGINA,
  )

  function cambiarFiltros(nuevos) {
    setFiltros(nuevos)
    setPagina(1)
  }

  function limpiarFiltros() {
    setFiltros(FILTROS_INICIALES)
    setPagina(1)
  }

  const resumen =
    filtrados.length === 0
      ? 'Sin movimientos'
      : `${filtrados.length} ${filtrados.length === 1 ? 'movimiento' : 'movimientos'}`

  return (
    <section className="historial" aria-labelledby="historial-titulo">
      <header className="historial__head">
        <h2 id="historial-titulo" className="historial__titulo">
          Historial de Movimientos
        </h2>
        <p className="historial__desc">
          Consulta, filtra y da seguimiento a los cargos y pagos de tu cuenta.
        </p>
      </header>

      <FiltrosMovimientos
        filtros={filtros}
        onCambio={cambiarFiltros}
        onLimpiar={limpiarFiltros}
        hayFiltrosActivos={hayFiltrosActivos}
      />

      {!cargando && !error && (
        <p className="historial__resumen" aria-live="polite">
          {resumen}
        </p>
      )}

      <div className="table-container">
        {cargando ? (
          <CargandoMovimientos />
        ) : error ? (
          <ErrorMovimientos onReintentar={onReintentar} />
        ) : visibles.length === 0 ? (
          <SinMovimientos conFiltros={hayFiltrosActivos} onLimpiar={limpiarFiltros} />
        ) : (
          <TablaMovimientos movimientos={visibles} />
        )}
      </div>

      {!cargando && !error && (
        <PaginacionMovimientos
          pagina={paginaActual}
          totalPaginas={totalPaginas}
          onPagina={setPagina}
        />
      )}
    </section>
  )
}

export default HistorialMovimientos
