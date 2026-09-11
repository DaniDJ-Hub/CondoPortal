// Sprint 1 — Frontend 1: pantalla de login.

import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useToast } from '../../../shared/hooks/useToast'

const CUENTAS_DEMO = [
  { etiqueta: 'Administración', email: 'admin@condoportal.com' },
  { etiqueta: 'Residente', email: 'residente@condoportal.com' },
]

function LoginForm() {
  const { entrar } = useAuth()
  const toast = useToast()
  const navegar = useNavigate()
  const ubicacion = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [verPassword, setVerPassword] = useState(false)
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function alEnviar(evento) {
    evento.preventDefault()
    setError('')
    setEnviando(true)

    try {
      const usuario = await entrar(email, password)
      toast.exito(`Bienvenida de vuelta, ${usuario.nombre}.`, { titulo: 'Sesión iniciada' })
      // Volvemos a donde la persona quería entrar antes del login.
      navegar(ubicacion.state?.desde ?? '/dashboard', { replace: true })
    } catch (fallo) {
      setError(fallo.message || 'No se pudo iniciar sesión.')
    } finally {
      setEnviando(false)
    }
  }

  // Atajo de la demo: rellena el formulario para no teclear las credenciales.
  function usarCuenta(correo) {
    setEmail(correo)
    setPassword('123456')
    setError('')
  }

  return (
    <form className="formulario" onSubmit={alEnviar} noValidate>
      {error && (
        <p className="alerta alerta--error" role="alert">
          {error}
        </p>
      )}

      <div className="campo">
        <label htmlFor="login-email">Correo electrónico</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="tucorreo@condoportal.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="campo">
        <label htmlFor="login-password">Contraseña</label>
        <div className="campo__con-boton">
          <input
            id="login-password"
            type={verPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            className="campo__accion"
            onClick={() => setVerPassword((visible) => !visible)}
            aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {verPassword ? 'Ocultar' : 'Ver'}
          </button>
        </div>
      </div>

      <button type="submit" className="btn btn--primary btn--bloque" disabled={enviando}>
        {enviando ? 'Entrando…' : 'Entrar'}
      </button>

      <p className="formulario__pie">
        ¿Todavía no tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>

      <div className="cuentas-demo">
        <p className="cuentas-demo__titulo">Cuentas de prueba (contraseña 123456)</p>
        <div className="cuentas-demo__botones">
          {CUENTAS_DEMO.map((cuenta) => (
            <button
              key={cuenta.email}
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => usarCuenta(cuenta.email)}
            >
              {cuenta.etiqueta}
            </button>
          ))}
        </div>
      </div>
    </form>
  )
}

export default LoginForm
