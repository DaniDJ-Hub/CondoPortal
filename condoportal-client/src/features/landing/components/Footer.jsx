// Sprint 4 — Frontend 2: footer institucional.

import { Link } from 'react-router-dom'

const SECCIONES = [
  {
    titulo: 'Portal',
    enlaces: [
      { texto: 'Iniciar sesión', a: '/login' },
      { texto: 'Crear cuenta', a: '/registro' },
      { texto: 'Marketplace', a: '/marketplace' },
    ],
  },
  {
    titulo: 'Condominio',
    enlaces: [
      { texto: 'Amenidades', a: '/#amenidades-titulo' },
      { texto: 'Reglamento interno', a: '/' },
      { texto: 'Asambleas', a: '/' },
    ],
  },
]

function Footer() {
  return (
    <footer className="pie" aria-labelledby="pie-titulo">
      <h2 id="pie-titulo" className="sr-only">Información institucional</h2>

      <div className="pie__interior">
        <div className="pie__marca">
          <span className="marca">
            <span className="marca__icono" aria-hidden="true">🏘️</span>
            <span className="marca__texto">CondoPortal</span>
          </span>
          <p className="pie__descripcion">
            Administración transparente para condominios: cuotas, gastos y comunidad en un mismo portal.
          </p>
        </div>

        <nav className="pie__enlaces" aria-label="Enlaces del pie de página">
          {SECCIONES.map((seccion) => (
            <div key={seccion.titulo}>
              <h3 className="pie__titulo">{seccion.titulo}</h3>
              <ul>
                {seccion.enlaces.map((enlace) => (
                  <li key={enlace.texto}>
                    <Link to={enlace.a}>{enlace.texto}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="pie__titulo">Contacto</h3>
            <ul>
              <li><a href="mailto:administracion@condoportal.com">administracion@condoportal.com</a></li>
              <li><a href="tel:+528110000001">81 1000 0001</a></li>
              <li>Lun a Vie · 9:00 a 18:00</li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="pie__legal">
        <p>© {new Date().getFullYear()} CondoPortal. Todos los derechos reservados.</p>
        <p>Aviso de privacidad · Términos y condiciones</p>
      </div>
    </footer>
  )
}

export default Footer
