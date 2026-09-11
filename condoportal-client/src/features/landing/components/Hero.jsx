// Sprint 4 — Frontend 2: landing page (hero y amenidades).

import { Link } from 'react-router-dom'

const AMENIDADES = [
  { emblema: '🏊', nombre: 'Alberca', detalle: 'Abierta de 8:00 a 21:00 con asoleadero y regaderas.' },
  { emblema: '🏋️', nombre: 'Gimnasio', detalle: 'Equipo de cardio y peso libre, acceso con credencial.' },
  { emblema: '🎉', nombre: 'Salón de eventos', detalle: 'Reservable desde el portal con 72 horas de anticipación.' },
  { emblema: '🐾', nombre: 'Área canina', detalle: 'Zona cercada con bebederos y bolsas sanitarias.' },
  { emblema: '🛝', nombre: 'Juegos infantiles', detalle: 'Superficie amortiguante y sombra natural.' },
  { emblema: '🛡️', nombre: 'Seguridad 24/7', detalle: 'Caseta con control de visitas y paquetería.' },
]

const CIFRAS = [
  { valor: '10', etiqueta: 'Unidades' },
  { valor: '6', etiqueta: 'Amenidades' },
  { valor: '24/7', etiqueta: 'Vigilancia' },
]

function Hero() {
  return (
    <>
      <section className="hero">
        <div className="hero__contenido">
          <p className="hero__eyebrow">Portal de residentes</p>
          <h1 className="hero__titulo">
            Tu condominio, <span className="hero__acento">claro y al día</span>
          </h1>
          <p className="hero__texto">
            Consulta tu estado de cuenta, paga tus cuotas en línea y revisa en qué se invierte
            el mantenimiento. Todo desde un mismo lugar, sin filas ni recibos de papel.
          </p>

          <div className="hero__acciones">
            <Link to="/login" className="btn btn--primary btn--lg">Entrar al portal</Link>
            <Link to="/registro" className="btn btn--ghost btn--lg">Crear cuenta</Link>
          </div>

          <dl className="hero__cifras">
            {CIFRAS.map((cifra) => (
              <div key={cifra.etiqueta}>
                <dt className="sr-only">{cifra.etiqueta}</dt>
                <dd>
                  <strong>{cifra.valor}</strong>
                  <span>{cifra.etiqueta}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Ilustración decorativa del conjunto: puro adorno, sin información
            que se pierda al ocultarla del lector de pantalla. */}
        <div className="hero__arte" aria-hidden="true">
          <svg viewBox="0 0 320 260" className="hero__ilustracion">
            <defs>
              <linearGradient id="torre" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#c2956f" />
                <stop offset="100%" stopColor="#8a5a34" />
              </linearGradient>
            </defs>
            <circle className="hero__sol" cx="252" cy="62" r="30" />
            <rect x="40" y="90" width="72" height="150" rx="6" fill="url(#torre)" />
            <rect x="124" y="50" width="80" height="190" rx="6" fill="url(#torre)" />
            <rect x="216" y="118" width="64" height="122" rx="6" fill="url(#torre)" />
            {[0, 1, 2, 3, 4].map((fila) =>
              [0, 1, 2].map((columna) => (
                <rect
                  key={`${fila}-${columna}`}
                  className="hero__ventana"
                  x={136 + columna * 22}
                  y={70 + fila * 32}
                  width="14"
                  height="20"
                  rx="2"
                />
              )),
            )}
            <rect className="hero__suelo" x="0" y="238" width="320" height="22" rx="4" />
            <path className="hero__arbusto" d="M24 238c0-14 10-24 22-24s22 10 22 24z" />
            <path className="hero__arbusto" d="M284 238c0-11 8-19 17-19s17 8 17 19z" />
          </svg>
        </div>
      </section>

      <section className="amenidades" aria-labelledby="amenidades-titulo">
        <header className="seccion__cabecera seccion__cabecera--centrada">
          <h2 id="amenidades-titulo" className="seccion__titulo">Amenidades del condominio</h2>
          <p className="seccion__sub">Todo lo que puedes disfrutar sin salir de casa.</p>
        </header>

        <ul className="amenidades__grid">
          {AMENIDADES.map((amenidad) => (
            <li key={amenidad.nombre} className="amenidad">
              <span className="amenidad__emblema" aria-hidden="true">{amenidad.emblema}</span>
              <h3 className="amenidad__nombre">{amenidad.nombre}</h3>
              <p className="amenidad__detalle">{amenidad.detalle}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

export default Hero
