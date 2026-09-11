// Sprint 4 — Frontend 2: perfil de proveedor.

import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApi } from '../../../shared/hooks/useApi'
import { useToast } from '../../../shared/hooks/useToast'
import { getNegocio, publicarResena } from '../api'
import { Calificacion, SelectorCalificacion } from './Calificacion'
import { Contenido } from '../../../shared/components/Estados'
import { fmtRelativo, iniciales } from '../../../shared/utils/formato'

function Contacto({ negocio }) {
  const datos = [
    negocio.telefono && { etiqueta: 'Teléfono', valor: negocio.telefono, href: `tel:${negocio.telefono.replace(/\D/g, '')}` },
    negocio.email && { etiqueta: 'Correo', valor: negocio.email, href: `mailto:${negocio.email}` },
    negocio.sitioWeb && { etiqueta: 'Sitio web', valor: negocio.sitioWeb.replace(/^https?:\/\//, ''), href: negocio.sitioWeb },
    negocio.horario && { etiqueta: 'Horario', valor: negocio.horario },
  ].filter(Boolean)

  if (datos.length === 0) return null

  return (
    <dl className="contacto">
      {datos.map((dato) => (
        <div key={dato.etiqueta}>
          <dt>{dato.etiqueta}</dt>
          <dd>
            {dato.href ? (
              <a href={dato.href} rel="noreferrer noopener" target={dato.href.startsWith('http') ? '_blank' : undefined}>
                {dato.valor}
              </a>
            ) : (
              dato.valor
            )}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function FormularioResena({ negocioId, onPublicada }) {
  const toast = useToast()
  const [calificacion, setCalificacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function alEnviar(evento) {
    evento.preventDefault()
    if (calificacion === 0) {
      toast.aviso('Elige cuántas estrellas le das antes de publicar.')
      return
    }

    setEnviando(true)
    try {
      const actualizado = await publicarResena(negocioId, { calificacion, comentario })
      toast.exito('¡Gracias! Tu reseña ya está publicada.')
      setComentario('')
      setCalificacion(0)
      onPublicada(actualizado)
    } catch (fallo) {
      toast.desdeError(fallo, 'No se pudo publicar tu reseña.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <form className="formulario resena-form" onSubmit={alEnviar}>
      <h3 className="subtitulo">Deja tu reseña</h3>
      <SelectorCalificacion valor={calificacion} onCambio={setCalificacion} />

      <div className="campo">
        <label htmlFor="resena-comentario">Comentario (opcional)</label>
        <textarea
          id="resena-comentario"
          rows={3}
          maxLength={400}
          placeholder="¿Cómo te fue con este proveedor?"
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
        />
      </div>

      <button type="submit" className="btn btn--primary" disabled={enviando}>
        {enviando ? 'Publicando…' : 'Publicar reseña'}
      </button>
      <p className="campo__ayuda">Si ya habías opinado sobre este negocio, tu reseña se actualiza.</p>
    </form>
  )
}

function PerfilProveedor() {
  const { id } = useParams()
  const cargar = useCallback(({ señal }) => getNegocio(id, { señal }), [id])
  const { datos: negocio, cargando, error, recargar, setDatos } = useApi(cargar, [id])

  return (
    <div className="pagina">
      <p className="migas">
        <Link to="/marketplace">← Volver al marketplace</Link>
      </p>

      <Contenido cargando={cargando} error={error} onReintentar={recargar} filasCarga={5}>
        {negocio && (
          <>
            <header className="perfil">
              <span className="perfil__emblema" aria-hidden="true">{negocio.emblema || '🏪'}</span>
              <div className="perfil__datos">
                <p className="perfil__categoria">{negocio.etiquetaCategoria}</p>
                <h1 className="titulo">
                  {negocio.nombre}
                  {negocio.destacado && <span className="perfil__destacado">Destacado</span>}
                </h1>
                <Calificacion valor={negocio.calificacion} total={negocio.totalResenas} />
                <p className="sub">{negocio.descripcion}</p>
              </div>
            </header>

            <div className="rejilla-2">
              <section className="panel" aria-labelledby="contacto-titulo">
                <h2 id="contacto-titulo" className="seccion__titulo">Contacto</h2>
                <Contacto negocio={negocio} />
                <FormularioResena negocioId={negocio.id} onPublicada={setDatos} />
              </section>

              <section className="panel" aria-labelledby="resenas-titulo">
                <h2 id="resenas-titulo" className="seccion__titulo">
                  Reseñas de vecinos ({negocio.totalResenas})
                </h2>

                {negocio.resenas.length === 0 ? (
                  <p className="sub">Todavía nadie ha opinado. Sé la primera persona en hacerlo.</p>
                ) : (
                  <ul className="resenas">
                    {negocio.resenas.map((resena) => (
                      <li key={resena.id} className="resena">
                        <span className="resena__avatar" aria-hidden="true">{iniciales(resena.autor)}</span>
                        <div className="resena__cuerpo">
                          <p className="resena__autor">{resena.autor}</p>
                          <Calificacion valor={resena.calificacion} compacta />
                          {resena.comentario && <p className="resena__texto">{resena.comentario}</p>}
                          <time className="resena__fecha" dateTime={resena.fecha}>{fmtRelativo(resena.fecha)}</time>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          </>
        )}
      </Contenido>
    </div>
  )
}

export default PerfilProveedor
