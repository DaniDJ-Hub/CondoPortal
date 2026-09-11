// Controlador de autenticación.
//
// Sprint 1 — Backend 1: "Crear endpoint de autenticación".
// Sprint 1 — Backend 2: "Manejo de sesión (token/logout)".
// Sprint 4 — Backend 1: "Registro de nuevos usuarios".

import {
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  crearUsuario,
  verificarPassword,
  usuarioPublico,
} from '../models/usuario.model.js'
import { emitirToken, revocarToken } from '../services/sesion.service.js'
import { asyncHandler, errorConflicto, ErrorHttp } from '../middleware/errorHandler.js'
import { requerirCampos, validarEmail, validarPassword } from '../middleware/validar.js'

export const login = asyncHandler(async (req, res) => {
  requerirCampos(req.body, ['email', 'password'])
  const email = validarEmail(req.body.email)

  const usuario = await buscarUsuarioPorEmail(email)

  // Mismo mensaje para usuario inexistente y contraseña incorrecta: así no
  // revelamos qué correos están dados de alta.
  const credencialesInvalidas = new ErrorHttp(401, 'Correo o contraseña incorrectos.')
  if (!usuario) throw credencialesInvalidas
  if (!(await verificarPassword(usuario, req.body.password))) throw credencialesInvalidas
  if (usuario.activo === false) throw new ErrorHttp(403, 'Esta cuenta está desactivada. Contacta a la administración.')

  const { token, expiraEn } = emitirToken(usuario)
  res.status(200).json({ token, expiraEn, usuario: usuarioPublico(usuario) })
})

// Registro de nuevos usuarios. El alta pública siempre crea residentes; sólo
// un administrador autenticado puede dar de alta otro rol.
export const registro = asyncHandler(async (req, res) => {
  requerirCampos(req.body, ['nombre', 'email', 'password'])
  const email = validarEmail(req.body.email)
  const password = validarPassword(req.body.password)

  if (await buscarUsuarioPorEmail(email)) {
    throw errorConflicto('Ya existe una cuenta registrada con ese correo.')
  }

  const rolSolicitado = req.body.rol
  const rol = req.usuario?.rol === 'admin' && rolSolicitado ? rolSolicitado : 'residente'

  const usuario = await crearUsuario({
    nombre: req.body.nombre,
    email,
    password,
    rol,
    unidad: req.body.unidad,
    telefono: req.body.telefono,
  })

  const { token, expiraEn } = emitirToken(usuario)
  res.status(201).json({ token, expiraEn, usuario })
})

// Devuelve el usuario de la sesión activa: el cliente lo usa al recargar para
// saber si el token guardado sigue siendo válido.
export const sesionActual = asyncHandler(async (req, res) => {
  const usuario = await buscarUsuarioPorId(req.usuario.id)
  if (!usuario) throw new ErrorHttp(401, 'La cuenta de esta sesión ya no existe.')
  res.status(200).json({ usuario: usuarioPublico(usuario), expiraEn: req.tokenPayload.exp })
})

// Cierra la sesión revocando el token actual, de modo que un token robado
// deje de servir aunque todavía no haya expirado.
export const logout = asyncHandler(async (req, res) => {
  revocarToken(req.tokenPayload)
  res.status(200).json({ mensaje: 'Sesión cerrada correctamente.' })
})

// Emite un token nuevo y revoca el anterior, para extender una sesión activa
// sin volver a pedir la contraseña.
export const renovarSesion = asyncHandler(async (req, res) => {
  const usuario = await buscarUsuarioPorId(req.usuario.id)
  if (!usuario || usuario.activo === false) {
    throw new ErrorHttp(401, 'La sesión ya no es válida.')
  }

  revocarToken(req.tokenPayload)
  const { token, expiraEn } = emitirToken(usuario)
  res.status(200).json({ token, expiraEn, usuario: usuarioPublico(usuario) })
})
