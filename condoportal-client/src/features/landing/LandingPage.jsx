// Sprint 4 — Frontend 2: página pública del condominio.

import { Link } from 'react-router-dom'
import Hero from './components/Hero'
import Footer from './components/Footer'
import ThemeToggle from '../../shared/components/ThemeToggle'
import { useAuth } from '../auth/hooks/useAuth'

function LandingPage() {
  const { autenticado } = useAuth()

  return (
    <div className="landing">
      <header className="landing__barra">
        <div className="landing__barra-interior">
          <Link to="/" className="marca">
            <span className="marca__icono" aria-hidden="true">🏘️</span>
            <span className="marca__texto">CondoPortal</span>
          </Link>

          <div className="landing__acciones">
            <Link to="/marketplace" className="landing__enlace">Marketplace</Link>
            <ThemeToggle compacto />
            <Link to={autenticado ? '/dashboard' : '/login'} className="btn btn--primary btn--sm">
              {autenticado ? 'Ir al portal' : 'Entrar'}
            </Link>
          </div>
        </div>
      </header>

      <main className="landing__contenido">
        <Hero />
      </main>

      <Footer />
    </div>
  )
}

export default LandingPage
