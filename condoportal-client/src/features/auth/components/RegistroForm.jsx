// Sprint 4 — Backend 1: "Registro de nuevos usuarios" (formulario del cliente).

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../../../shared/hooks/useToast'

const INICIAL = { nombre: '', email: '', password: '', confirmacion: '', unidad: '', telefono: '' }

function RegistroForm() {
  const { registrarse } = useAuth()
  const toast = useToast()
  const navegar = useNavigate()

  const [datos, setDatos] = useState(INICIAL)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  const actualizar = (campo) => (evento) => setDatos((previos) => ({ ...previos, [campo]: evento.target.value }))

  async function alEnviar(evento) {
    evento.preventDefault()
    setError('')

    // Validación local de lo que el servidor no puede saber: que las dos
    // contraseñas coincidan.
    if (datos.password !== datos.confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setEnviando(true)
    try {
      const usuario = await registrarse({
        nombre: datos.nombre,
        email: datos.email,
        password: datos.password,
        unidad: datos.unidad || null,
        telefono: datos.telefono || null,
      })
      toast.exito(`Tu cuenta quedó lista, ${usuario.nombre}.`, { titulo: 'Registro completado' })
      navegar('/dashboard', { replace: true })
    } catch (fallo) {
      setError(fallo.message || 'No se pudo completar el registro.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="formulario" onSubmit={alEnviar} noValidate>
      {error && (
        <p className="alerta alerta--error" role="alert">
          {error}
        </p>
      )}

      <div className="campo">
        <label htmlFor="registro-nombre">Nombre completo</label>
        <input id="registro-nombre" type="text" autoComplete="name" value={datos.nombre}
          onChange={actualizar('nombre')} required />
      </div>

      <div className="campo">
        <label htmlFor="registro-email">Correo electrónico</label>
        <input id="registro-email" type="email" autoComplete="email" value={datos.email}
          onChange={actualizar('email')} required />
      </div>

      <div className="campo-fila">
        <div className="campo">
          <label htmlFor="registro-unidad">Unidad</label>
          <input id="registro-unidad" type="text" placeholder="A-101" value={datos.unidad}
            onChange={actualizar('unidad')} />
        </div>
        <div className="campo">
          <label htmlFor="registro-telefono">Teléfono</label>
          <input id="registro-telefono" type="tel" autoComplete="tel" placeholder="81-1000-0000"
            value={datos.telefono} onChange={actualizar('telefono')} />
        </div>
      </div>

      <div className="campo-fila">
        <div className="campo">
          <label htmlFor="registro-password">Contraseña</label>
          <input id="registro-password" type="password" autoComplete="new-password" minLength={6}
            value={datos.password} onChange={actualizar('password')} required />
          <small className="campo__ayuda">Mínimo 6 caracteres.</small>
        </div>
        <div className="campo">
          <label htmlFor="registro-confirmacion">Confirmar contraseña</label>
          <input id="registro-confirmacion" type="password" autoComplete="new-password" minLength={6}
            value={datos.confirmacion} onChange={actualizar('confirmacion')} required />
        </div>
      </div>

      <button type="submit" className="btn btn--primary btn--bloque" disabled={enviando}>
        {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>

      <p className="formulario__pie">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </form>
  )
}

export default RegistroForm
