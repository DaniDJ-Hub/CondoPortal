// Sprint 2 — Frontend 2: una fila del Historial de Movimientos.

import { CONFIG_TIPO, CONFIG_ESTADO } from '../../constantes'

const fmtFecha = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
})

const fmtMoneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
})

function IconoTipo({ nombre }) {
  const props = {
    width: 14,
    height: 14,
    viewBox: '0 0 16 16',
    'aria-hidden': true,
    focusable: false,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  if (nombre === 'entra') return <svg {...props}><path d="M12 4 4 12m0-5v5h5" /></svg>
  if (nombre === 'sale') return <svg {...props}><path d="M4 12 12 4M7 4h5v5" /></svg>
  if (nombre === 'tarjeta') return <svg {...props}><rect x="2" y="4" width="12" height="8" rx="1.5" /><path d="M2 7h12" /></svg>
  return <svg {...props}><circle cx="8" cy="8" r="3" fill="currentColor" stroke="none" /></svg>
}

function FilaMovimiento({ mov }) {
  const tipo = CONFIG_TIPO[mov.tipo] ?? CONFIG_TIPO.otro
  const estado = CONFIG_ESTADO[mov.estado] ?? { etiqueta: mov.estado, clase: 'badge--neutral' }

  const fecha = fmtFecha.format(new Date(`${mov.fecha}T00:00:00`))
  const montoAbs = fmtMoneda.format(mov.monto)
  const montoTexto =
    tipo.signo > 0 ? `+ ${montoAbs}` : tipo.signo < 0 ? `− ${montoAbs}` : montoAbs
  const montoAria =
    tipo.signo > 0
      ? `Ingreso de ${montoAbs}`
      : tipo.signo < 0
        ? `Cargo de ${montoAbs}`
        : `Movimiento de ${montoAbs}`

  return (
    <tr className={`mov ${tipo.clase}`}>
      <td data-label="Fecha" className="mov__fecha">{fecha}</td>

      <td data-label="Concepto" className="mov__concepto">
        <span className="mov__concepto-texto">{mov.concepto}</span>
        <small className="mov__meta">
          {/* Los cargos no tienen método de pago: se omite en vez de dejar un hueco. */}
          {mov.metodo && <>{mov.metodo} · </>}
          <code className="folio">{mov.id}</code>
        </small>
      </td>

      <td data-label="Tipo">
        <span className={`tipo-pill ${tipo.clase}`}>
          <IconoTipo nombre={tipo.icono} />
          {tipo.etiqueta}
        </span>
      </td>

      <td data-label="Monto" className="mov__monto">
        <span aria-label={montoAria}>{montoTexto}</span>
      </td>

      <td data-label="Estado">
        <span className={`badge ${estado.clase}`}>{estado.etiqueta}</span>
      </td>

      <td data-label="Saldo" className="mov__saldo">
        {mov.saldo == null ? (
          <span className="mov__saldo-na" aria-label="Sin saldo asociado">—</span>
        ) : (
          fmtMoneda.format(mov.saldo)
        )}
      </td>
    </tr>
  )
}

export default FilaMovimiento
