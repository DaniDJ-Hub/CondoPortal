// Sprint 3 — Frontend 1: dashboard con KPIs.

import { fmtMoneda, fmtNumero, fmtPorcentaje } from '../../../shared/utils/formato'
import { Contenido } from '../../../shared/components/Estados'

function Variacion({ valor, invertida = false }) {
  if (valor === null || valor === undefined) return null

  const sube = valor > 0
  // En los egresos, subir es malo: se invierte el color, no la flecha.
  const esBuena = invertida ? !sube : sube
  const tono = valor === 0 ? 'neutra' : esBuena ? 'buena' : 'mala'

  return (
    <span className={`kpi__variacion kpi__variacion--${tono}`}>
      <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {sube ? <path d="M8 13V3m0 0L4 7m4-4 4 4" /> : <path d="M8 3v10m0 0 4-4m-4 4-4-4" />}
      </svg>
      {fmtPorcentaje(Math.abs(valor))}
      <span className="sr-only"> respecto al mes anterior</span>
    </span>
  )
}

function Tarjeta({ etiqueta, valor, detalle, variacion, invertida, tono = 'neutro', icono }) {
  return (
    <article className={`kpi kpi--${tono}`}>
      <header className="kpi__cabecera">
        <span className="kpi__icono" aria-hidden="true">{icono}</span>
        <h3 className="kpi__etiqueta">{etiqueta}</h3>
      </header>
      <p className="kpi__valor">{valor}</p>
      <footer className="kpi__pie">
        {detalle && <span className="kpi__detalle">{detalle}</span>}
        <Variacion valor={variacion} invertida={invertida} />
      </footer>
    </article>
  )
}

function KpiCards({ kpis, cargando, error, onReintentar }) {
  return (
    <section className="seccion" aria-labelledby="kpis-titulo">
      <header className="seccion__cabecera">
        <h2 id="kpis-titulo" className="seccion__titulo">Indicadores del condominio</h2>
        {kpis?.etiquetaMesActual && <p className="seccion__sub">Mes en curso: {kpis.etiquetaMesActual}</p>}
      </header>

      <Contenido cargando={cargando} error={error} onReintentar={onReintentar} filasCarga={4}>
        <div className="kpi-grid">
          <Tarjeta
            etiqueta="Saldo del fondo"
            valor={fmtMoneda(kpis?.saldoActual)}
            detalle="Ingresos menos egresos acumulados"
            tono={kpis?.saldoActual >= 0 ? 'positivo' : 'negativo'}
            icono="💰"
          />
          <Tarjeta
            etiqueta="Ingresos del mes"
            valor={fmtMoneda(kpis?.ingresosDelMes)}
            detalle={`${fmtMoneda(kpis?.totalIngresos)} en total`}
            variacion={kpis?.variacionIngresos}
            icono="📥"
          />
          <Tarjeta
            etiqueta="Egresos del mes"
            valor={fmtMoneda(kpis?.egresosDelMes)}
            detalle={`${fmtMoneda(kpis?.totalEgresos)} en total`}
            variacion={kpis?.variacionEgresos}
            invertida
            icono="📤"
          />
          <Tarjeta
            etiqueta="Por cobrar"
            valor={fmtMoneda(kpis?.porCobrar)}
            detalle={`${fmtNumero(kpis?.cuotasVencidas)} ${kpis?.cuotasVencidas === 1 ? 'cuota vencida' : 'cuotas vencidas'}`}
            tono={kpis?.porCobrar > 0 ? 'alerta' : 'positivo'}
            icono="⏳"
          />
          <Tarjeta
            etiqueta="Morosidad"
            valor={fmtPorcentaje(kpis?.tasaMorosidad)}
            detalle={`${fmtNumero(kpis?.residentesMorosos)} de ${fmtNumero(kpis?.residentes)} residentes`}
            tono={kpis?.tasaMorosidad > 25 ? 'negativo' : kpis?.tasaMorosidad > 0 ? 'alerta' : 'positivo'}
            icono="🏠"
          />
        </div>
      </Contenido>
    </section>
  )
}

export default KpiCards
