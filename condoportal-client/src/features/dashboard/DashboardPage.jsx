// Sprint 3 — tablero principal.
//
// Una sola llamada a /api/dashboard alimenta las cuatro secciones, para no
// encadenar peticiones al montar la vista.

import { useState } from 'react'
import { useApi } from '../../shared/hooks/useApi'
import { useAuth } from '../auth/hooks/useAuth'
import { getResumen } from './api'
import KpiCards from './components/KpiCards'
import FlujoDeCajaChart from './components/FlujoDeCajaChart'
import ActividadReciente from './components/ActividadReciente'
import GastosPorCategoria from './components/GastosPorCategoria'

function DashboardPage() {
  const { usuario } = useAuth()
  const [meses, setMeses] = useState(6)
  const { datos, cargando, error, recargar } = useApi(
    ({ señal }) => getResumen(meses, { señal }),
    [meses],
  )

  const nombreCorto = usuario?.nombre?.split(' ')[0] ?? ''

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <p className="eyebrow">Resumen de tu comunidad</p>
          <h1 className="titulo">Hola, {nombreCorto}</h1>
          <p className="sub">Así va la salud financiera del condominio.</p>
        </div>
      </header>

      <KpiCards kpis={datos?.kpis} cargando={cargando} error={error} onReintentar={recargar} />

      <FlujoDeCajaChart
        flujo={datos?.flujo}
        cargando={cargando}
        error={error}
        onReintentar={recargar}
        meses={meses}
        onCambiarMeses={setMeses}
      />

      <div className="rejilla-2">
        <ActividadReciente
          actividad={datos?.actividad}
          cargando={cargando}
          error={error}
          onReintentar={recargar}
        />
        <GastosPorCategoria
          categorias={datos?.gastosPorCategoria}
          cargando={cargando}
          error={error}
          onReintentar={recargar}
        />
      </div>
    </div>
  )
}

export default DashboardPage
