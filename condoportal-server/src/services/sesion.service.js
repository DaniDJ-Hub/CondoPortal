// Manejo de sesión — Sprint 1 (Backend 2): "Manejo de sesión (token/logout)".
//
// El JWT es autocontenido, así que un logout real necesita una lista de
// revocación: al cerrar sesión guardamos el identificador del token (jti)
// hasta que expire por sí solo, y el middleware lo rechaza mientras tanto.
//
// TODO(infra): en producción con varias instancias, mover esta lista a Redis
// o a una tabla `sesiones_revocadas` para que se comparta entre procesos.

import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'

const revocados = new Map() // jti -> epoch (segundos) en que expira el token

// Evita que la lista crezca sin límite: un token ya expirado se rechaza solo.
function limpiarExpirados() {
  const ahora = Math.floor(Date.now() / 1000)
  for (const [jti, expiraEn] of revocados) {
    if (expiraEn <= ahora) revocados.delete(jti)
  }
}

export function emitirToken(usuario) {
  const jti = crypto.randomUUID()
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol, nombre: usuario.nombre },
    config.jwtSecret,
    { expiresIn: config.jwtExpiracion, jwtid: jti },
  )
  return { token, jti, expiraEn: jwt.decode(token).exp }
}

export function verificarToken(token) {
  const payload = jwt.verify(token, config.jwtSecret)
  if (payload.jti && revocados.has(payload.jti)) {
    const error = new Error('Sesión cerrada')
    error.name = 'TokenRevocadoError'
    throw error
  }
  return payload
}

export function revocarToken(payload) {
  if (!payload?.jti) return false
  limpiarExpirados()
  revocados.set(payload.jti, payload.exp ?? Math.floor(Date.now() / 1000))
  return true
}

export function sesionesRevocadas() {
  limpiarExpirados()
  return revocados.size
}

// Sólo para pruebas: deja la lista de revocación en blanco.
export function limpiarRevocados() {
  revocados.clear()
}
