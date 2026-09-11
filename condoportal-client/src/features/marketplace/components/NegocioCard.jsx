// Sprint 4 — Frontend 1: tarjeta del grid de negocios del marketplace.

import { Link } from 'react-router-dom'
import { Calificacion } from './Calificacion'

function NegocioCard({ negocio }) {
  if (!negocio) return null

  return (
    <article className="negocio-card">
      {negocio.destacado && <span className="negocio-card__destacado">Destacado</span>}

      <header className="negocio-card__cabecera">
        <span className="negocio-card__emblema" aria-hidden="true">{negocio.emblema || '🏪'}</span>
        <div>
          <h3 className="negocio-card__nombre">
            {/* Toda la tarjeta es pulsable vía ::after, pero el enlace real va
                en el título para que el foco y el menú contextual funcionen. */}
            <Link to={`/marketplace/${negocio.id}`} className="negocio-card__enlace">
              {negocio.nombre}
            </Link>
          </h3>
          <p className="negocio-card__categoria">{negocio.etiquetaCategoria}</p>
        </div>
      </header>

      <p className="negocio-card__descripcion">{negocio.descripcion}</p>

      <footer className="negocio-card__pie">
        <Calificacion valor={negocio.calificacion} total={negocio.totalResenas} />
        {negocio.horario && <p className="negocio-card__horario">{negocio.horario}</p>}
      </footer>
    </article>
  )
}

export default NegocioCard
