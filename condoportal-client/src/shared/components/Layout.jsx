// Armazón de las pantallas con sesión iniciada: barra superior con la
// navegación por rol, el toggle de tema y el menú de la cuenta.

import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useToast } from '../hooks/useToast'
import ThemeToggle from './ThemeToggle'
import { iniciales } from '../utils/formato'

const ENLACES = [
  { a: '/dashboard', texto: 'Dashboard' },
  { a: '/pagos', texto: 'Pagos' },
  { a: '/gastos', texto: 'Gastos' },
  { a: '/marketplace', texto: 'Marketplace' },
  { a: '/mapa', texto: 'Mapa' },
  { a: '/admin', texto: 'Administración', soloAdmin: true },
]

function Layout({ children }) {
  const { usuario, esAdmin, salir } = useAuth()
  const toast = useToast()
  const navegar = useNavigate()
  const [menuAbierto, setMenuAbierto] = useState(false)

  const enlaces = ENLACES.filter((enlace) => !enlace.soloAdmin || esAdmin)

  async function cerrarSesion() {
    await salir()
    toast.info('Cerraste sesión. ¡Hasta pronto!')
    navegar('/login')
  }

  return (
    <div className="app">
      <a className="saltar-al-contenido" href="#contenido">
        Saltar al contenido
      </a>

      <header className="barra">
        <div className="barra__interior">
          <Link to="/dashboard" className="marca" onClick={() => setMenuAbierto(false)}>
            <span className="marca__icono" aria-hidden="true">🏘️</span>
            <span className="marca__texto">CondoPortal</span>
          </Link>

          <button
            type="button"
            className="barra__menu"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-expanded={menuAbierto}
            aria-controls="navegacion-principal"
            aria-label="Abrir menú de navegación"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none"
              stroke="currentColor" strokeWidth="1.9" strokeLinecap="round">
              {menuAbierto ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>

          <nav
            id="navegacion-principal"
            className={`nav${menuAbierto ? ' nav--abierta' : ''}`}
            aria-label="Navegación principal"
          >
            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.a}
                to={enlace.a}
                className={({ isActive }) => `nav__enlace${isActive ? ' nav__enlace--activo' : ''}`}
                onClick={() => setMenuAbierto(false)}
              >
                {enlace.texto}
              </NavLink>
            ))}
          </nav>

          <div className="barra__acciones">
            <ThemeToggle compacto />
            <div className="cuenta">
              <span className="cuenta__avatar" aria-hidden="true">{iniciales(usuario?.nombre)}</span>
              <span className="cuenta__datos">
                <span className="cuenta__nombre">{usuario?.nombre}</span>
                <span className="cuenta__rol">{usuario?.unidad ? `Unidad ${usuario.unidad}` : usuario?.rol}</span>
              </span>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={cerrarSesion}>
              Salir
            </button>
          </div>
        </div>
      </header>

      <main id="contenido" className="contenido">
        {children}
      </main>
    </div>
  )
}

export default Layout
