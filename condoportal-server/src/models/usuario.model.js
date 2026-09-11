// Modelo de usuarios: acceso a datos y reglas propias de la entidad.
//
// Toda la persistencia pasa por `db()`, así que el mismo código sirve para
// PostgreSQL y para el almacén en memoria.

import bcrypt from 'bcryptjs'
import { db } from '../db/index.js'
import { aInstanteISO } from '../utils/numeros.js'

export const ROLES_VALIDOS = ['admin', 'residente', 'proveedor']

// Nunca dejamos salir el hash de contraseña hacia la API.
export function usuarioPublico(usuario) {
  if (!usuario) return null
  const { passwordHash: _hash, ...resto } = usuario
  return { ...resto, activo: resto.activo !== false, creadoEn: aInstanteISO(resto.creadoEn) }
}

export async function listarUsuarios({ rol, activo } = {}) {
  const usuarios = await db().usuarios.todos({ rol, activo }, { orden: 'id' })
  return usuarios.map(usuarioPublico)
}

export async function buscarUsuarioPorEmail(email) {
  if (!email) return null
  return db().usuarios.uno({ email: String(email).trim().toLowerCase() })
}

export async function buscarUsuarioPorId(id) {
  return db().usuarios.porId(id)
}

export async function crearUsuario({ nombre, email, password, rol = 'residente', unidad = null, telefono = null }) {
  const usuario = await db().usuarios.insertar({
    nombre: nombre.trim(),
    email: email.trim().toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    rol,
    unidad: unidad?.trim() || null,
    telefono: telefono?.trim() || null,
    activo: true,
    creadoEn: new Date().toISOString(),
  })
  return usuarioPublico(usuario)
}

export async function verificarPassword(usuario, password) {
  if (!usuario?.passwordHash) return false
  return bcrypt.compare(password, usuario.passwordHash)
}

export async function actualizarRol(id, rol) {
  const usuario = await db().usuarios.actualizar(id, { rol })
  return usuarioPublico(usuario)
}

export async function actualizarUsuario(id, { nombre, unidad, telefono, activo }) {
  const usuario = await db().usuarios.actualizar(id, { nombre, unidad, telefono, activo })
  return usuarioPublico(usuario)
}

// Baja lógica: conserva el historial de pagos y gastos asociado al usuario.
export async function desactivarUsuario(id) {
  const usuario = await db().usuarios.actualizar(id, { activo: false })
  return usuarioPublico(usuario)
}
