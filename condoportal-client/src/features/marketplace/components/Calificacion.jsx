// Estrellas de calificación, en modo lectura o como entrada de un formulario.

function Estrella({ llena, media }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" className="estrella">
      {media && (
        <defs>
          <linearGradient id="media-estrella">
            <stop offset="50%" stopColor="currentColor" />
            <stop offset="50%" stopColor="transparent" />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z"
        fill={media ? 'url(#media-estrella)' : llena ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Calificacion({ valor, total, compacta = false }) {
  if (valor === null || valor === undefined) {
    return <span className="calificacion calificacion--vacia">Sin reseñas todavía</span>
  }

  return (
    <span className="calificacion" title={`${valor} de 5`}>
      <span className="calificacion__estrellas" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((posicion) => (
          <Estrella
            key={posicion}
            llena={valor >= posicion}
            media={valor > posicion - 1 && valor < posicion}
          />
        ))}
      </span>
      <span className="calificacion__texto">
        {valor.toFixed(1)}
        {total !== undefined && !compacta && (
          <span className="calificacion__total"> · {total} {total === 1 ? 'reseña' : 'reseñas'}</span>
        )}
      </span>
      <span className="sr-only">
        Calificación {valor} de 5{total !== undefined ? `, basada en ${total} reseñas` : ''}
      </span>
    </span>
  )
}

// Entrada de calificación: cinco radios reales, para que funcione con teclado
// y con lector de pantalla sin JavaScript de por medio.
export function SelectorCalificacion({ valor, onCambio, nombre = 'calificacion' }) {
  return (
    <fieldset className="selector-calificacion">
      <legend>Tu calificación</legend>
      <div className="selector-calificacion__opciones">
        {[1, 2, 3, 4, 5].map((posicion) => (
          <label key={posicion} className="selector-calificacion__opcion">
            <input
              type="radio"
              name={nombre}
              value={posicion}
              checked={valor === posicion}
              onChange={() => onCambio(posicion)}
            />
            <span className="sr-only">{posicion} de 5</span>
            <span className={`selector-calificacion__estrella${valor >= posicion ? ' es-activa' : ''}`} aria-hidden="true">
              <Estrella llena={valor >= posicion} />
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
