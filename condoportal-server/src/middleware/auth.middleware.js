// Middleware de autenticación JWT — Sprint 2 (Backend 2).
//
// `requireAuth` valida el token y deja el usuario en `req.usuario`.
// `requireRole` restringe el acceso por rol, y `requirePropietarioORol`
// permite que un residente vea sus propios datos sin ser administrador.

import { verificarToken } from '../services/sesion.service.js'

function extraerToken(req) {
  const cabecera = req.headers.authorization || ''
  const [esquema, token] = cabecera.split(' ')
  if (esquema?.toLowerCase() !== 'bearer' || !token) return null
  return token.trim()
}

export function requireAuth(req, res, next) {
  const token = extraerToken(req)
  if (!token) {
    return res.status(401).json({ error: 'Falta el token de acceso. Inicia sesión para continuar.' })
  }

  try {
    const payload = verificarToken(token)
    req.usuario = { id: payload.id, email: payload.email, rol: payload.rol, nombre: payload.nombre }
    req.tokenPayload = payload
    return next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Tu sesión expiró. Vuelve a iniciar sesión.', codigo: 'TOKEN_EXPIRADO' })
    }
    if (error.name === 'TokenRevocadoError') {
      return res.status(401).json({ error: 'Esta sesión ya fue cerrada.', codigo: 'TOKEN_REVOCADO' })
    }
    return res.status(401).json({ error: 'Token inválido.', codigo: 'TOKEN_INVALIDO' })
  }
}

// Autenticación opcional: si viene un token válido se usa, si no se continúa
// como visitante. Útil en el marketplace, que es público pero muestra extras
// a quien ha iniciado sesión.
export function authOpcional(req, _res, next) {
  const token = extraerToken(req)
  if (!token) return next()
  try {
    const payload = verificarToken(token)
    req.usuario = { id: payload.id, email: payload.email, rol: payload.rol, nombre: payload.nombre }
    req.tokenPayload = payload
  } catch {
    // Un token inválido en una ruta pública simplemente se ignora.
  }
  return next()
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Falta el token de acceso. Inicia sesión para continuar.' })
    }
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ error: 'Tu rol no tiene permiso para esta acción.' })
    }
    return next()
  }
}

// El dueño del recurso (o un admin) puede continuar; cualquier otro recibe 403.
export function requirePropietarioORol(obtenerIdDueno, ...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Falta el token de acceso. Inicia sesión para continuar.' })
    }
    if (roles.includes(req.usuario.rol)) return next()
    if (Number(obtenerIdDueno(req)) === Number(req.usuario.id)) return next()
    return res.status(403).json({ error: 'Sólo puedes consultar tu propia información.' })
  }
}
