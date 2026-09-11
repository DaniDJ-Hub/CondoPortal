// Sprint 4 — Full-Stack/QA: mapa interactivo.
//
// El plano se dibuja en SVG con las coordenadas en porcentaje que entrega la
// API, sin depender de un servicio de mapas externo ni de una llave de API.
// Seleccionar un punto —con clic o con teclado— muestra su ficha al lado.

const ANCHO = 100
const ALTO = 100

function MapaInteractivo({ puntos = [], seleccionado, onSeleccionar }) {
  return (
    <div className="mapa">
      <svg
        className="mapa__lienzo"
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        role="group"
        aria-label="Plano del condominio con los puntos de interés"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Fondo del terreno y trazas de las vialidades: sólo contexto visual,
            por eso queda fuera del árbol de accesibilidad. */}
        <g aria-hidden="true">
          <rect className="mapa__terreno" x="0" y="0" width={ANCHO} height={ALTO} rx="3" />
          <rect className="mapa__manzana" x="10" y="12" width="34" height="26" rx="2" />
          <rect className="mapa__manzana" x="58" y="12" width="32" height="26" rx="2" />
          <rect className="mapa__manzana" x="10" y="56" width="30" height="30" rx="2" />
          <rect className="mapa__manzana" x="56" y="56" width="34" height="30" rx="2" />
          <path className="mapa__via" d="M50 0 V100" />
          <path className="mapa__via" d="M0 47 H100" />
          <path className="mapa__via mapa__via--secundaria" d="M0 78 H100" />
        </g>

        {puntos.map((punto) => {
          const activo = seleccionado?.id === punto.id
          return (
            <g
              key={punto.id}
              className={`mapa__pin${activo ? ' mapa__pin--activo' : ''}`}
              transform={`translate(${punto.x} ${punto.y})`}
              tabIndex={0}
              role="button"
              aria-pressed={activo}
              aria-label={`${punto.nombre}. ${punto.etiquetaCategoria}. A ${punto.distanciaM} metros.`}
              onClick={() => onSeleccionar(activo ? null : punto)}
              onKeyDown={(evento) => {
                if (evento.key === 'Enter' || evento.key === ' ') {
                  evento.preventDefault()
                  onSeleccionar(activo ? null : punto)
                }
              }}
            >
              <circle className="mapa__pin-halo" r={activo ? 5.2 : 0} />
              <circle className="mapa__pin-base" r="3.1" />
              <text className="mapa__pin-emblema" y="1.15" textAnchor="middle">
                {punto.emblema}
              </text>
            </g>
          )
        })}
      </svg>

      <p className="mapa__ayuda">
        Toca un punto del plano para ver su información. Con teclado, navega con Tab y confirma con Enter.
      </p>
    </div>
  )
}

export default MapaInteractivo
