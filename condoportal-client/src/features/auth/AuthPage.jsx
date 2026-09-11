// Pantalla pública de acceso: login y registro comparten el mismo marco.

import { Link } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import RegistroForm from './components/RegistroForm'
import ThemeToggle from '../../shared/components/ThemeToggle'

const VENTAJAS = [
  'Consulta tu estado de cuenta y paga tus cuotas en línea.',
  'Revisa en qué se gasta el mantenimiento del condominio.',
  'Descubre los negocios y servicios de tus vecinos.',
]

function AuthPage({ modo = 'login' }) {
  const esRegistro = modo === 'registro'

  return (
    <div className="acceso">
      <aside className="acceso__promo">
        <Link to="/" className="marca marca--claro">
          <span className="marca__icono" aria-hidden="true">🏘️</span>
          <span className="marca__texto">CondoPortal</span>
        </Link>

        <div className="acceso__promo-cuerpo">
          <h2 className="acceso__lema">La administración de tu condominio, en un solo lugar.</h2>
          <ul className="acceso__ventajas">
            {VENTAJAS.map((ventaja) => (
              <li key={ventaja}>
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m5 12.5 4.5 4.5L19 7" />
                </svg>
                {ventaja}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main className="acceso__panel">
        <div className="acceso__panel-cabecera">
          <ThemeToggle compacto />
        </div>

        <div className="acceso__formulario">
          <h1 className="titulo">{esRegistro ? 'Crea tu cuenta' : 'Iniciar sesión'}</h1>
          <p className="sub">
            {esRegistro
              ? 'Regístrate con el correo que diste a la administración de tu condominio.'
              : 'Entra con tu correo y contraseña para ver tu estado de cuenta.'}
          </p>

          {esRegistro ? <RegistroForm /> : <LoginForm />}
        </div>
      </main>
    </div>
  )
}

export default AuthPage
