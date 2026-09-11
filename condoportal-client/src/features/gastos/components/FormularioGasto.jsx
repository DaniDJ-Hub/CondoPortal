// Sprint 1 — alta y edición de gastos (sólo administración).

import { useEffect, useRef, useState } from 'react'
import { crearGasto, actualizarGasto } from '../api'
import { useToast } from '../../../shared/hooks/useToast'

const hoy = () => new Date().toISOString().slice(0, 10)

function FormularioGasto({ gasto, categorias = [], onCerrar, onGuardado }) {
  const toast = useToast()
  const esEdicion = Boolean(gasto)
  const primerCampo = useRef(null)

  const [datos, setDatos] = useState(() => ({
    descripcion: gasto?.descripcion ?? '',
    categoria: gasto?.categoria ?? categorias[0]?.valor ?? 'mantenimiento',
    monto: gasto?.monto != null ? String(gasto.monto) : '',
    fecha: gasto?.fecha ?? hoy(),
    proveedor: gasto?.proveedor ?? '',
  }))
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    primerCampo.current?.focus()
    const alTeclear = (evento) => {
      if (evento.key === 'Escape') onCerrar()
    }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [onCerrar])

  const actualizar = (campo) => (evento) => setDatos((previos) => ({ ...previos, [campo]: evento.target.value }))

  async function alEnviar(evento) {
    evento.preventDefault()
    setError('')
    setEnviando(true)

    const cuerpo = {
      descripcion: datos.descripcion.trim(),
      categoria: datos.categoria,
      monto: Number(datos.monto),
      fecha: datos.fecha,
      proveedor: datos.proveedor.trim() || null,
    }

    try {
      const guardado = esEdicion ? await actualizarGasto(gasto.id, cuerpo) : await crearGasto(cuerpo)
      toast.exito(esEdicion ? 'Gasto actualizado.' : 'Gasto registrado.')
      onGuardado(guardado)
    } catch (fallo) {
      setError(fallo.message || 'No se pudo guardar el gasto.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-gasto-titulo">
        <header className="modal__cabecera">
          <h2 id="modal-gasto-titulo" className="modal__titulo">
            {esEdicion ? 'Editar gasto' : 'Registrar gasto'}
          </h2>
          <button type="button" className="modal__cerrar" onClick={onCerrar} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </header>

        <form className="modal__cuerpo formulario" onSubmit={alEnviar} noValidate>
          {error && (
            <p className="alerta alerta--error" role="alert">
              {error}
            </p>
          )}

          <div className="campo">
            <label htmlFor="gasto-descripcion">Descripción</label>
            <input
              id="gasto-descripcion"
              ref={primerCampo}
              type="text"
              value={datos.descripcion}
              onChange={actualizar('descripcion')}
              required
            />
          </div>

          <div className="campo-fila">
            <div className="campo">
              <label htmlFor="gasto-categoria">Categoría</label>
              <select id="gasto-categoria" value={datos.categoria} onChange={actualizar('categoria')}>
                {categorias.map((categoria) => (
                  <option key={categoria.valor} value={categoria.valor}>{categoria.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="gasto-monto">Monto</label>
              <input id="gasto-monto" type="number" inputMode="decimal" min="0.01" step="0.01"
                value={datos.monto} onChange={actualizar('monto')} required />
            </div>
          </div>

          <div className="campo-fila">
            <div className="campo">
              <label htmlFor="gasto-fecha">Fecha</label>
              <input id="gasto-fecha" type="date" value={datos.fecha} onChange={actualizar('fecha')} required />
            </div>
            <div className="campo">
              <label htmlFor="gasto-proveedor">Proveedor</label>
              <input id="gasto-proveedor" type="text" value={datos.proveedor} onChange={actualizar('proveedor')} />
            </div>
          </div>

          <div className="modal__acciones">
            <button type="button" className="btn btn--ghost" onClick={onCerrar} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={enviando}>
              {enviando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioGasto
