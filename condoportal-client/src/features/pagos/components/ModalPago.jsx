// Sprint 2 — Backend 2: "Flujo de pago de cuota" (interfaz del cliente).
//
// Diálogo de pago. Si llega una cuota concreta, propone su saldo; si no, deja
// abonar una cantidad libre que el servidor reparte entre las cuotas abiertas.

import { useEffect, useRef, useState } from 'react'
import { pagarCuota } from '../api'
import { useToast } from '../../../shared/hooks/useToast'
import { fmtMoneda } from '../../../shared/utils/formato'

const METODOS = [
  { valor: 'transferencia', etiqueta: 'Transferencia' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta' },
  { valor: 'domiciliacion', etiqueta: 'Domiciliación' },
  { valor: 'efectivo', etiqueta: 'Efectivo' },
]

function ModalPago({ cuota, onCerrar, onPagado }) {
  const toast = useToast()
  const [monto, setMonto] = useState(() => (cuota ? String(cuota.saldo) : ''))
  const [metodo, setMetodo] = useState('transferencia')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const primerCampo = useRef(null)

  // Al abrir, el foco entra al diálogo y Escape lo cierra.
  useEffect(() => {
    primerCampo.current?.focus()
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  async function alEnviar(evento) {
    evento.preventDefault()
    setError('')

    const cantidad = Number(monto)
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      setError('Escribe una cantidad mayor que cero.')
      return
    }

    setEnviando(true)
    try {
      const respuesta = await pagarCuota({
        monto: cantidad,
        metodo,
        ...(cuota && { cuotaId: cuota.id, concepto: cuota.concepto }),
      })

      const cubiertas = respuesta.pagos.filter((pago) => pago.cuotaId !== null).length
      toast.exito(
        cubiertas > 1
          ? `Se aplicaron ${fmtMoneda(cantidad)} a ${cubiertas} cuotas. Recibo ${respuesta.recibo.folio}.`
          : `Pago de ${fmtMoneda(cantidad)} registrado. Recibo ${respuesta.recibo.folio}.`,
        { titulo: 'Pago aplicado' },
      )
      onPagado(respuesta)
    } catch (fallo) {
      setError(fallo.message || 'No se pudo registrar el pago.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-pago-titulo">
        <header className="modal__cabecera">
          <h2 id="modal-pago-titulo" className="modal__titulo">
            {cuota ? 'Pagar cuota' : 'Hacer un abono'}
          </h2>
          <button type="button" className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>

        <form className="modal__cuerpo formulario" onSubmit={alEnviar} noValidate>
          {cuota ? (
            <p className="modal__resumen">
              <strong>{cuota.concepto}</strong>
              <span>Saldo pendiente: {fmtMoneda(cuota.saldo)}</span>
            </p>
          ) : (
            <p className="modal__resumen">
              <span>
                El abono se aplica a tus cuotas con saldo, de la más antigua a la más reciente.
                Lo que sobre queda a tu favor.
              </span>
            </p>
          )}

          {error && (
            <p className="alerta alerta--error" role="alert">
              {error}
            </p>
          )}

          <div className="campo">
            <label htmlFor="pago-monto">Cantidad a pagar</label>
            <input
              id="pago-monto"
              ref={primerCampo}
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="pago-metodo">Método de pago</label>
            <select id="pago-metodo" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
              {METODOS.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>
              ))}
            </select>
          </div>

          <div className="modal__acciones">
            <button type="button" className="btn btn--ghost" onClick={onCerrar} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={enviando}>
              {enviando ? 'Procesando…' : 'Confirmar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ModalPago
