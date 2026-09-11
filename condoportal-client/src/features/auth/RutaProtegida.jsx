// Rutas protegidas por sesión y, opcionalmente, por rol.
//
// Mientras se valida el token guardado no redirigimos: si lo hiciéramos,
// recargar una página interna rebotaría al login antes de saber si la sesión
// sigue viva.

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import Layout from '../../shared/components/Layout'
import { Cargando } from '../../shared/components/Estados'

function RutaProtegida({ children, roles }) {
  const { autenticado, cargando, usuario } = useAuth()
  const ubicacion = useLocation()

  if (cargando) {
    return (
      <div className="pantalla-carga">
        <Cargando texto="Validando tu sesión…" filas={2} />
      </div>
    )
  }

  if (!autenticado) {
    // Recordamos a dónde iba para volver ahí después del login.
    return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />
  }

  if (roles && !roles.includes(usuario.rol)) {
    return (
      <Layout>
        <section className="panel panel--centrado">
          <h1 className="titulo">Sin acceso</h1>
          <p className="sub">
            Tu rol ({usuario.rol}) no tiene permiso para ver esta sección. Si crees que es un error,
            contacta a la administración.
          </p>
        </section>
      </Layout>
    )
  }

  return <Layout>{children}</Layout>
}

export default RutaProtegida
