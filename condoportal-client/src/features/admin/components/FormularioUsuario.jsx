// Sprint 5 — alta manual de usuarios desde el panel de administración.

import { useEffect, useRef, useState } from 'react'
import { crearUsuario } from '../api'
import { useToast } from '../../../shared/hooks/useToast'

const ROLES = [
  { valor: 'residente', etiqueta: 'Residente' },
  { valor: 'proveedor', etiqueta: 'Proveedor' },
  { valor: 'admin', etiqueta: 'Administración' },
]

const INICIAL = { nombre: '', email: '', password: '', rol: 'residente', unidad: '', telefono: '' }

function FormularioUsuario({ onCerrar, onCreado }) {
  const toast = useToast()
  const [datos, setDatos] = useState(INICIAL)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const primerCampo = useRef(null)

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

    try {
      const creado = await crearUsuario({
        ...datos,
        unidad: datos.unidad || null,
        telefono: datos.telefono || null,
      })
      toast.exito(`${creado.nombre} ya puede entrar al portal.`, { titulo: 'Usuario creado' })
      onCreado(creado)
    } catch (fallo) {
      setError(fallo.message || 'No se pudo crear el usuario.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="modal-fondo" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-usuario-titulo">
        <header className="modal__cabecera">
          <h2 id="modal-usuario-titulo" className="modal__titulo">Añadir usuario</h2>
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
            <label htmlFor="usuario-nombre">Nombre completo</label>
            <input id="usuario-nombre" ref={primerCampo} type="text" value={datos.nombre}
              onChange={actualizar('nombre')} required />
          </div>

          <div className="campo">
            <label htmlFor="usuario-email">Correo electrónico</label>
            <input id="usuario-email" type="email" value={datos.email} onChange={actualizar('email')} required />
          </div>

          <div className="campo-fila">
            <div className="campo">
              <label htmlFor="usuario-rol">Rol</label>
              <select id="usuario-rol" value={datos.rol} onChange={actualizar('rol')}>
                {ROLES.map((rol) => (
                  <option key={rol.valor} value={rol.valor}>{rol.etiqueta}</option>
                ))}
              </select>
            </div>
            <div className="campo">
              <label htmlFor="usuario-unidad">Unidad</label>
              <input id="usuario-unidad" type="text" placeholder="A-101" value={datos.unidad}
                onChange={actualizar('unidad')} />
            </div>
          </div>

          <div className="campo-fila">
            <div className="campo">
              <label htmlFor="usuario-telefono">Teléfono</label>
              <input id="usuario-telefono" type="tel" value={datos.telefono} onChange={actualizar('telefono')} />
            </div>
            <div className="campo">
              <label htmlFor="usuario-password">Contraseña temporal</label>
              <input id="usuario-password" type="text" minLength={6} value={datos.password}
                onChange={actualizar('password')} required />
              <small className="campo__ayuda">Mínimo 6 caracteres. Compártela con la persona.</small>
            </div>
          </div>

          <div className="modal__acciones">
            <button type="button" className="btn btn--ghost" onClick={onCerrar} disabled={enviando}>
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary" disabled={enviando}>
              {enviando ? 'Creando…' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default FormularioUsuario
