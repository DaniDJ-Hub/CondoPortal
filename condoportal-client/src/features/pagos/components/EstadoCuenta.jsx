// Sprint 2 — Frontend 1: vista resumen del estado de cuenta.
//
// Responde de un vistazo: cuánto debo, qué vence y cuándo, y me deja pagar
// sin salir de la pantalla.

import { useState } from 'react'
import { fmtMoneda, fmtFechaLarga, diasHasta } from '../../../shared/utils/formato'
import { Contenido, SinDatos } from '../../../shared/components/Estados'
import ModalPago from './ModalPago'

const CONFIG_ESTATUS = {
  pagada: { etiqueta: 'Pagada', clase: 'badge--ok' },
  parcial: { etiqueta: 'Abonada', clase: 'badge--warning' },
  pendiente: { etiqueta: 'Pendiente', clase: 'badge--warning' },
  vencida: { etiqueta: 'Vencida', clase: 'badge--danger' },
}

// Texto del vencimiento en lenguaje natural: "vence en 5 días", "venció hace
// 12 días". Es la información que la persona busca primero.
function textoVencimiento(fecha) {
  const dias = diasHasta(fecha)
  if (dias === null) return ''
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return 'Vence mañana'
  if (dias > 1) return `Vence en ${dias} días`
  if (dias === -1) return 'Venció ayer'
  return `Venció hace ${Math.abs(dias)} días`
}

function EstadoCuenta({ estado, cargando, error, onReintentar, onPagado }) {
  const [cuotaAPagar, setCuotaAPagar] = useState(null)

  const alDia = estado?.alCorriente
  const tono = alDia ? 'positivo' : estado?.saldoVencido > 0 ? 'negativo' : 'alerta'

  return (
    <section className="seccion" aria-labelledby="estado-cuenta-titulo">
      <header className="seccion__cabecera">
        <h2 id="estado-cuenta-titulo" className="seccion__titulo">Estado de cuenta</h2>
        <p className="seccion__sub">Tu saldo, tus cuotas y lo que sigue por pagar.</p>
      </header>

      <Contenido cargando={cargando} error={error} onReintentar={onReintentar} filasCarga={4}>
        {estado && (
          <>
            <div className={`resumen-cuenta resumen-cuenta--${tono}`}>
              <div className="resumen-cuenta__principal">
                <p className="resumen-cuenta__etiqueta">
                  {alDia ? 'Estás al corriente' : 'Saldo pendiente'}
                </p>
                <p className="resumen-cuenta__monto">{fmtMoneda(estado.saldoPendiente)}</p>

                {estado.saldoVencido > 0 && (
                  <p className="resumen-cuenta__aviso">
                    <strong>{fmtMoneda(estado.saldoVencido)}</strong> corresponde a cuotas vencidas.
                  </p>
                )}
                {estado.saldoAFavor > 0 && (
                  <p className="resumen-cuenta__aviso resumen-cuenta__aviso--bueno">
                    Tienes <strong>{fmtMoneda(estado.saldoAFavor)}</strong> a favor para tu próxima cuota.
                  </p>
                )}

                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setCuotaAPagar(estado.proximaCuota ?? 'libre')}
                  disabled={alDia && estado.saldoPendiente === 0 && !estado.proximaCuota}
                >
                  {alDia ? 'Hacer un abono' : 'Pagar ahora'}
                </button>
              </div>

              <dl className="resumen-cuenta__datos">
                <div>
                  <dt>Próxima cuota</dt>
                  <dd>
                    {estado.proximaCuota ? (
                      <>
                        {fmtMoneda(estado.proximaCuota.monto)}
                        <span className="resumen-cuenta__nota">
                          {textoVencimiento(estado.proximaCuota.venceEn)}
                        </span>
                      </>
                    ) : (
                      'Sin cuotas por vencer'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Cuotas abiertas</dt>
                  <dd>
                    {estado.cuotasPendientes}
                    {estado.cuotasVencidas > 0 && (
                      <span className="resumen-cuenta__nota">{estado.cuotasVencidas} vencidas</span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Total pagado</dt>
                  <dd>{fmtMoneda(estado.totalPagado)}</dd>
                </div>
                <div>
                  <dt>Último pago</dt>
                  <dd>
                    {estado.ultimoPago ? (
                      <>
                        {fmtMoneda(estado.ultimoPago.monto)}
                        <span className="resumen-cuenta__nota">{fmtFechaLarga(estado.ultimoPago.fecha)}</span>
                      </>
                    ) : (
                      'Sin pagos registrados'
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <h3 className="subtitulo">Detalle de cuotas</h3>

            {estado.cuotas.length === 0 ? (
              <SinDatos
                titulo="No tienes cuotas asignadas"
                texto="Cuando la administración emita tus cuotas de mantenimiento aparecerán aquí."
              />
            ) : (
            <div className="table-container">
              <table className="table">
                <caption className="sr-only">Cuotas del residente con su saldo y estatus.</caption>
                <thead>
                  <tr>
                    <th scope="col">Concepto</th>
                    <th scope="col">Vence</th>
                    <th scope="col" className="celda--numero">Monto</th>
                    <th scope="col" className="celda--numero">Pagado</th>
                    <th scope="col" className="celda--numero">Saldo</th>
                    <th scope="col">Estatus</th>
                    <th scope="col"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {estado.cuotas.map((cuota) => {
                    const config = CONFIG_ESTATUS[cuota.estatus] ?? CONFIG_ESTATUS.pendiente
                    return (
                      <tr key={cuota.id}>
                        <td data-label="Concepto">{cuota.concepto}</td>
                        <td data-label="Vence">
                          {fmtFechaLarga(cuota.venceEn)}
                          {cuota.saldo > 0 && (
                            <small className="celda__nota">{textoVencimiento(cuota.venceEn)}</small>
                          )}
                        </td>
                        <td data-label="Monto" className="celda--numero">{fmtMoneda(cuota.monto)}</td>
                        <td data-label="Pagado" className="celda--numero">{fmtMoneda(cuota.pagado)}</td>
                        <td data-label="Saldo" className="celda--numero">{fmtMoneda(cuota.saldo)}</td>
                        <td data-label="Estatus">
                          <span className={`badge ${config.clase}`}>{config.etiqueta}</span>
                        </td>
                        <td data-label="Acciones">
                          {cuota.saldo > 0 && (
                            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCuotaAPagar(cuota)}>
                              Pagar
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            )}
          </>
        )}
      </Contenido>

      {cuotaAPagar && (
        <ModalPago
          cuota={cuotaAPagar === 'libre' ? null : cuotaAPagar}
          onCerrar={() => setCuotaAPagar(null)}
          onPagado={(respuesta) => {
            setCuotaAPagar(null)
            onPagado?.(respuesta)
          }}
        />
      )}
    </section>
  )
}

export default EstadoCuenta
