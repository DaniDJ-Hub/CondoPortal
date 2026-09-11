// Sprint 5 — Backend 1 (lógica) + soporte visual: gestión de usuarios y roles.

import { useState } from 'react'
import { actualizarRol, desactivarUsuario } from '../api'
import { useToast } from '../../../shared/hooks/useToast'
import { useAuth } from '../../auth/hooks/useAuth'
import { Contenido, SinDatos } from '../../../shared/components/Estados'
import { fmtFecha, iniciales } from '../../../shared/utils/formato'

const ROLES = [
  { valor: 'admin', etiqueta: 'Administración' },
  { valor: 'residente', etiqueta: 'Residente' },
  { valor: 'proveedor', etiqueta: 'Proveedor' },
]

function GestionUsuarios({ usuarios = [], cargando, error, onReintentar, onCambio, onNuevo }) {
  const toast = useToast()
  const { usuario: sesion } = useAuth()
  // Guardamos el id en curso para deshabilitar sólo esa fila mientras se
  // guarda, en vez de bloquear la tabla entera.
  const [guardando, setGuardando] = useState(null)
  const [filtro, setFiltro] = useState('todos')

  const visibles = filtro === 'todos' ? usuarios : usuarios.filter((u) => u.rol === filtro)

  async function cambiarRol(usuario, rol) {
    if (rol === usuario.rol) return

    setGuardando(usuario.id)
    try {
      await actualizarRol(usuario.id, rol)
      toast.exito(`${usuario.nombre} ahora es ${ROLES.find((r) => r.valor === rol).etiqueta.toLowerCase()}.`)
      onCambio()
    } catch (fallo) {
      toast.desdeError(fallo, 'No se pudo cambiar el rol.')
    } finally {
      setGuardando(null)
    }
  }

  async function darDeBaja(usuario) {
    if (!window.confirm(`¿Desactivar la cuenta de ${usuario.nombre}? Dejará de poder iniciar sesión.`)) return

    setGuardando(usuario.id)
    try {
      await desactivarUsuario(usuario.id)
      toast.exito(`La cuenta de ${usuario.nombre} quedó desactivada.`)
      onCambio()
    } catch (fallo) {
      toast.desdeError(fallo, 'No se pudo desactivar la cuenta.')
    } finally {
      setGuardando(null)
    }
  }

  return (
    <section className="seccion panel" aria-labelledby="usuarios-titulo">
      <header className="seccion__cabecera seccion__cabecera--fila">
        <div>
          <h2 id="usuarios-titulo" className="seccion__titulo">Usuarios y roles</h2>
          <p className="seccion__sub">Quién tiene acceso al portal y con qué permisos.</p>
        </div>
        <button type="button" className="btn btn--primary btn--sm" onClick={onNuevo}>
          Añadir usuario
        </button>
      </header>

      <div className="chips" role="group" aria-label="Filtrar por rol">
        {[{ valor: 'todos', etiqueta: 'Todos' }, ...ROLES].map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            className={`chip${filtro === opcion.valor ? ' chip--activo' : ''}`}
            onClick={() => setFiltro(opcion.valor)}
            aria-pressed={filtro === opcion.valor}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>

      <Contenido
        cargando={cargando}
        error={error}
        onReintentar={onReintentar}
        filasCarga={5}
        vacio={visibles.length === 0 ? <SinDatos titulo="Sin usuarios con ese rol" /> : null}
      >
        <div className="table-container">
          <table className="table">
            <caption className="sr-only">Usuarios registrados con su rol y estado.</caption>
            <thead>
              <tr>
                <th scope="col">Usuario</th>
                <th scope="col">Unidad</th>
                <th scope="col">Alta</th>
                <th scope="col">Rol</th>
                <th scope="col">Estado</th>
                <th scope="col"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((usuario) => {
                const esYo = usuario.id === sesion?.id
                const bloqueado = guardando === usuario.id

                return (
                  <tr key={usuario.id} className={usuario.activo ? '' : 'fila--inactiva'}>
                    <td data-label="Usuario">
                      <div className="usuario-celda">
                        <span className="usuario-celda__avatar" aria-hidden="true">{iniciales(usuario.nombre)}</span>
                        <span>
                          <span className="celda__principal">
                            {usuario.nombre}
                            {esYo && <span className="etiqueta etiqueta--tu">Tú</span>}
                          </span>
                          <small className="celda__nota">{usuario.email}</small>
                        </span>
                      </div>
                    </td>
                    <td data-label="Unidad">{usuario.unidad || '—'}</td>
                    <td data-label="Alta">{fmtFecha(usuario.creadoEn)}</td>
                    <td data-label="Rol">
                      <label className="sr-only" htmlFor={`rol-${usuario.id}`}>
                        Rol de {usuario.nombre}
                      </label>
                      <select
                        id={`rol-${usuario.id}`}
                        value={usuario.rol}
                        onChange={(e) => cambiarRol(usuario, e.target.value)}
                        disabled={bloqueado || !usuario.activo}
                      >
                        {ROLES.map((rol) => (
                          <option key={rol.valor} value={rol.valor}>{rol.etiqueta}</option>
                        ))}
                      </select>
                    </td>
                    <td data-label="Estado">
                      <span className={`badge ${usuario.activo ? 'badge--ok' : 'badge--neutral'}`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td data-label="Acciones">
                      {usuario.activo && !esYo && (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm btn--peligro"
                          onClick={() => darDeBaja(usuario)}
                          disabled={bloqueado}
                        >
                          Desactivar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Contenido>
    </section>
  )
}

export default GestionUsuarios
