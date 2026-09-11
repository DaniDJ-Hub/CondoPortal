// Sprint 3 — Frontend 2: gráfico de flujo de caja.
//
// SVG dibujado a mano, sin librería de gráficas: el proyecto no tiene ninguna
// instalada y el caso es acotado (barras mensuales más una línea de saldo).
//
// Usa dos escalas a propósito. Las barras miden el movimiento de cada mes
// (miles de pesos) y la línea mide el saldo acumulado, que crece en otro orden
// de magnitud: con un solo eje la línea aplastaría las barras contra el suelo.

import { useMemo, useState } from 'react'
import { fmtMoneda, fmtMonedaCorta } from '../../../shared/utils/formato'
import { Contenido, SinDatos } from '../../../shared/components/Estados'

const ANCHO = 760
const ALTO = 320
const MARGEN = { arriba: 16, derecha: 60, abajo: 44, izquierda: 64 }

const ANCHO_TRAZO = ANCHO - MARGEN.izquierda - MARGEN.derecha
const ALTO_TRAZO = ALTO - MARGEN.arriba - MARGEN.abajo

// Redondea el tope del eje hacia arriba a una cifra "bonita" (2500, 5000,
// 10000…) para que las marcas caigan en números legibles.
function topeBonito(valor) {
  if (valor <= 0) return 1000
  const magnitud = 10 ** Math.floor(Math.log10(valor))
  const normalizado = valor / magnitud
  const paso = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 2.5 ? 2.5 : normalizado <= 5 ? 5 : 10
  return paso * magnitud
}

function escalaLineal(dominioMin, dominioMax, rangoMin, rangoMax) {
  const amplitud = dominioMax - dominioMin || 1
  return (valor) => rangoMax - ((valor - dominioMin) / amplitud) * (rangoMax - rangoMin)
}

function FlujoDeCajaChart({ flujo, cargando, error, onReintentar, meses, onCambiarMeses }) {
  const [activo, setActivo] = useState(null)
  const serie = useMemo(() => flujo?.serie ?? [], [flujo])

  const grafico = useMemo(() => {
    if (serie.length === 0) return null

    const maxBarra = topeBonito(Math.max(...serie.flatMap((p) => [p.ingresos, p.egresos]), 1))

    const saldos = serie.map((p) => p.saldo)
    const maxSaldo = Math.max(...saldos, 0)
    const minSaldo = Math.min(...saldos, 0)
    // Un 8 % de aire arriba y abajo para que la línea no toque los bordes.
    const aire = (maxSaldo - minSaldo || Math.abs(maxSaldo) || 1) * 0.08

    const yBarra = escalaLineal(0, maxBarra, MARGEN.arriba, MARGEN.arriba + ALTO_TRAZO)
    const ySaldo = escalaLineal(minSaldo - aire, maxSaldo + aire, MARGEN.arriba, MARGEN.arriba + ALTO_TRAZO)

    const anchoRanura = ANCHO_TRAZO / serie.length
    const anchoBarra = Math.min(26, (anchoRanura - 14) / 2)
    const centroDe = (i) => MARGEN.izquierda + anchoRanura * (i + 0.5)

    const marcas = Array.from({ length: 5 }, (_, i) => (maxBarra / 4) * i)

    const puntosSaldo = serie.map((punto, i) => ({ x: centroDe(i), y: ySaldo(punto.saldo), punto }))
    const trazoSaldo = puntosSaldo.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

    return { maxBarra, minSaldo, maxSaldo, yBarra, ySaldo, anchoRanura, anchoBarra, centroDe, marcas, puntosSaldo, trazoSaldo }
  }, [serie])

  const detalle = activo !== null ? serie[activo] : null

  return (
    <section className="seccion panel" aria-labelledby="flujo-titulo">
      <header className="seccion__cabecera seccion__cabecera--fila">
        <div>
          <h2 id="flujo-titulo" className="seccion__titulo">Flujo de caja</h2>
          <p className="seccion__sub">Ingresos y egresos por mes, con el saldo acumulado del fondo.</p>
        </div>

        {onCambiarMeses && (
          <div className="campo campo--inline">
            <label htmlFor="flujo-meses">Periodo</label>
            <select id="flujo-meses" value={meses} onChange={(e) => onCambiarMeses(Number(e.target.value))}>
              <option value={6}>Últimos 6 meses</option>
              <option value={12}>Últimos 12 meses</option>
              <option value={24}>Últimos 24 meses</option>
            </select>
          </div>
        )}
      </header>

      <Contenido
        cargando={cargando}
        error={error}
        onReintentar={onReintentar}
        filasCarga={5}
        vacio={serie.length === 0 ? <SinDatos titulo="Aún no hay movimientos que graficar" /> : null}
      >
        {grafico && (
          <>
            <div className="grafico__leyenda">
              <span className="leyenda__item leyenda__item--ingresos">Ingresos</span>
              <span className="leyenda__item leyenda__item--egresos">Egresos</span>
              <span className="leyenda__item leyenda__item--saldo">Saldo acumulado</span>
            </div>

            <div className="grafico">
              <svg
                className="grafico__svg"
                viewBox={`0 0 ${ANCHO} ${ALTO}`}
                role="img"
                aria-labelledby="flujo-titulo flujo-desc"
                onMouseLeave={() => setActivo(null)}
              >
                <desc id="flujo-desc">
                  Gráfico de barras de ingresos y egresos por mes con una línea del saldo acumulado.
                  El detalle numérico está en la tabla que sigue.
                </desc>

                {/* Rejilla y eje izquierdo: movimientos del mes */}
                {grafico.marcas.map((marca) => (
                  <g key={marca}>
                    <line
                      className="grafico__rejilla"
                      x1={MARGEN.izquierda}
                      x2={MARGEN.izquierda + ANCHO_TRAZO}
                      y1={grafico.yBarra(marca)}
                      y2={grafico.yBarra(marca)}
                    />
                    <text className="grafico__marca" x={MARGEN.izquierda - 10} y={grafico.yBarra(marca) + 4} textAnchor="end">
                      {fmtMonedaCorta(marca)}
                    </text>
                  </g>
                ))}

                {/* Eje derecho: saldo acumulado */}
                {[grafico.maxSaldo, (grafico.maxSaldo + grafico.minSaldo) / 2, grafico.minSaldo].map((valor, i) => (
                  <text
                    key={i}
                    className="grafico__marca grafico__marca--saldo"
                    x={MARGEN.izquierda + ANCHO_TRAZO + 10}
                    y={grafico.ySaldo(valor) + 4}
                  >
                    {fmtMonedaCorta(valor)}
                  </text>
                ))}

                {serie.map((punto, i) => {
                  const centro = grafico.centroDe(i)
                  const base = MARGEN.arriba + ALTO_TRAZO
                  const yIngresos = grafico.yBarra(punto.ingresos)
                  const yEgresos = grafico.yBarra(punto.egresos)

                  return (
                    <g key={punto.mes}>
                      {/* Zona sensible de toda la columna: facilita apuntar
                          con el dedo en pantallas chicas. */}
                      <rect
                        className={`grafico__zona${activo === i ? ' grafico__zona--activa' : ''}`}
                        x={centro - grafico.anchoRanura / 2}
                        y={MARGEN.arriba}
                        width={grafico.anchoRanura}
                        height={ALTO_TRAZO}
                        tabIndex={0}
                        role="button"
                        aria-label={`${punto.etiqueta}: ingresos ${fmtMoneda(punto.ingresos)}, egresos ${fmtMoneda(punto.egresos)}, saldo ${fmtMoneda(punto.saldo)}`}
                        onMouseEnter={() => setActivo(i)}
                        onFocus={() => setActivo(i)}
                        onBlur={() => setActivo(null)}
                      />

                      <rect
                        className="grafico__barra grafico__barra--ingresos"
                        x={centro - grafico.anchoBarra - 2}
                        y={yIngresos}
                        width={grafico.anchoBarra}
                        height={Math.max(0, base - yIngresos)}
                        rx="3"
                      />
                      <rect
                        className="grafico__barra grafico__barra--egresos"
                        x={centro + 2}
                        y={yEgresos}
                        width={grafico.anchoBarra}
                        height={Math.max(0, base - yEgresos)}
                        rx="3"
                      />

                      <text className="grafico__etiqueta-x" x={centro} y={ALTO - 16} textAnchor="middle">
                        {punto.etiqueta}
                      </text>
                    </g>
                  )
                })}

                {/* Línea de saldo por encima de las barras */}
                <path className="grafico__linea" d={grafico.trazoSaldo} />
                {grafico.puntosSaldo.map(({ x, y, punto }, i) => (
                  <circle
                    key={punto.mes}
                    className={`grafico__punto${activo === i ? ' grafico__punto--activo' : ''}`}
                    cx={x}
                    cy={y}
                    r={activo === i ? 5.5 : 3.5}
                  />
                ))}
              </svg>

              {detalle && (
                <div
                  className="grafico__tooltip"
                  // Se posiciona en porcentaje sobre el ancho real del SVG, así
                  // el detalle sigue a la columna a cualquier tamaño.
                  style={{ left: `${(grafico.centroDe(activo) / ANCHO) * 100}%` }}
                  role="status"
                >
                  <p className="grafico__tooltip-mes">{detalle.etiqueta}</p>
                  <dl>
                    <div><dt>Ingresos</dt><dd className="es-ingreso">{fmtMoneda(detalle.ingresos)}</dd></div>
                    <div><dt>Egresos</dt><dd className="es-egreso">{fmtMoneda(detalle.egresos)}</dd></div>
                    <div><dt>Neto</dt><dd className={detalle.neto >= 0 ? 'es-ingreso' : 'es-egreso'}>{fmtMoneda(detalle.neto)}</dd></div>
                    <div><dt>Saldo</dt><dd>{fmtMoneda(detalle.saldo)}</dd></div>
                  </dl>
                </div>
              )}
            </div>

            <div className="grafico__totales">
              <p><span>Ingresos del periodo</span><strong className="es-ingreso">{fmtMoneda(flujo.totales.ingresos)}</strong></p>
              <p><span>Egresos del periodo</span><strong className="es-egreso">{fmtMoneda(flujo.totales.egresos)}</strong></p>
              <p>
                <span>Resultado neto</span>
                <strong className={flujo.totales.neto >= 0 ? 'es-ingreso' : 'es-egreso'}>{fmtMoneda(flujo.totales.neto)}</strong>
              </p>
              <p><span>Saldo final</span><strong>{fmtMoneda(flujo.totales.saldoFinal)}</strong></p>
            </div>

            {/* Alternativa textual: un gráfico SVG no es navegable con lector
                de pantalla, la tabla sí. */}
            <details className="grafico__datos">
              <summary>Ver los datos en tabla</summary>
              <div className="table-container">
                <table className="table">
                  <caption className="sr-only">Ingresos, egresos y saldo acumulado por mes.</caption>
                  <thead>
                    <tr>
                      <th scope="col">Mes</th>
                      <th scope="col">Ingresos</th>
                      <th scope="col">Egresos</th>
                      <th scope="col">Neto</th>
                      <th scope="col">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serie.map((punto) => (
                      <tr key={punto.mes}>
                        <td data-label="Mes">{punto.etiqueta}</td>
                        <td data-label="Ingresos">{fmtMoneda(punto.ingresos)}</td>
                        <td data-label="Egresos">{fmtMoneda(punto.egresos)}</td>
                        <td data-label="Neto">{fmtMoneda(punto.neto)}</td>
                        <td data-label="Saldo">{fmtMoneda(punto.saldo)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </>
        )}
      </Contenido>
    </section>
  )
}

export default FlujoDeCajaChart
