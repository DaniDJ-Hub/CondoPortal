// Armazón de las pantallas con sesión iniciada: barra superior con la
// navegación por rol, el toggle de tema y el menú de la cuenta.
//
// La navegación se dibuja con PillNav (diseño de Frontend 1). El armazón no
// cambia: PillNav sustituye a la lista de enlaces y se queda además con el
// menú compacto, así que la barra ya no necesita su propio botón de
// hamburguesa —había dos y se abrían por separado.

import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { useToast } from '../hooks/useToast'
import PillNav from './PillNav'
import ThemeToggle from './ThemeToggle'
import { iniciales } from '../utils/formato'

const ENLACES = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/pagos', label: 'Pagos' },
  { href: '/gastos', label: 'Gastos' },
  { href: '/marketplace', label: 'Marketplace' },
  { href: '/mapa', label: 'Mapa' },
  { href: '/admin', label: 'Administración', soloAdmin: true },
]

function Layout({ children }) {
  const { usuario, esAdmin, salir } = useAuth()
  const toast = useToast()
  const navegar = useNavigate()

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
          <Link to="/dashboard" className="marca">
            <span className="marca__icono" aria-hidden="true">🏘️</span>
            <span className="marca__texto">CondoPortal</span>
          </Link>

          <PillNav items={enlaces} />

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
