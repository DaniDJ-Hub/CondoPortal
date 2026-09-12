// Sprint 4 — Frontend 2: landing page (hero y amenidades).
//
// El hero adopta el diseño de Frontend 1: banda a sangre, fondo de hilos
// animados y texto claro sobre un velo de color. La ilustración SVG del
// conjunto se retiró al hacer el cambio; era decorativa y el sitio que
// ocupaba lo toma ahora la animación.

import { Link } from 'react-router-dom'
import Threads from '../../../shared/components/Threads'

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
        <div className="hero__hilos" aria-hidden="true">
          <Threads amplitude={1} distance={0} enableMouseInteraction />
        </div>

        <div className="hero__contenido">
          <p className="eyebrow">Portal de residentes</p>
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
      </section>

      <section className="amenidades" aria-labelledby="amenidades-titulo">
        <header className="seccion__cabecera seccion__cabecera--centrada">
          <p className="eyebrow">Vida en comunidad</p>
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
