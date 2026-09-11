// Controlador de administración — Sprint 5 (Backend 1):
// "Gestión de usuarios y roles", más el resumen del panel general.

import {
  listarUsuarios,
  buscarUsuarioPorId,
  buscarUsuarioPorEmail,
  crearUsuario,
  actualizarRol,
  actualizarUsuario,
  desactivarUsuario,
  usuarioPublico,
  ROLES_VALIDOS,
} from '../models/usuario.model.js'
import { indicadores } from '../models/dashboard.model.js'
import { listarNegocios } from '../models/negocio.model.js'
import { asyncHandler, errorNoEncontrado, errorConflicto, errorPeticion } from '../middleware/errorHandler.js'
import { requerirCampos, validarOpcion, validarId, validarEmail, validarPassword } from '../middleware/validar.js'

// GET /api/admin/usuarios?rol=
export const listar = asyncHandler(async (req, res) => {
  const { rol } = req.query
  if (rol) validarOpcion(rol, ROLES_VALIDOS, 'El rol')

  const usuarios = await listarUsuarios({ rol })
  res.status(200).json({
    usuarios,
    cantidad: usuarios.length,
    porRol: ROLES_VALIDOS.map((valor) => ({
      rol: valor,
      cantidad: usuarios.filter((u) => u.rol === valor).length,
    })),
  })
})

// GET /api/admin/usuarios/:usuarioId
export const detalle = asyncHandler(async (req, res) => {
  const usuario = await buscarUsuarioPorId(validarId(req.params.usuarioId, 'id del usuario'))
  if (!usuario) throw errorNoEncontrado('Usuario no encontrado.')
  res.status(200).json(usuarioPublico(usuario))
})

// POST /api/admin/usuarios — alta manual desde el panel.
export const crear = asyncHandler(async (req, res) => {
  requerirCampos(req.body, ['nombre', 'email', 'password', 'rol'])

  const email = validarEmail(req.body.email)
  if (await buscarUsuarioPorEmail(email)) {
    throw errorConflicto('Ya existe una cuenta registrada con ese correo.')
  }

  const usuario = await crearUsuario({
    nombre: req.body.nombre,
    email,
    password: validarPassword(req.body.password),
    rol: validarOpcion(req.body.rol, ROLES_VALIDOS, 'El rol'),
    unidad: req.body.unidad,
    telefono: req.body.telefono,
  })

  res.status(201).json(usuario)
})

// PATCH /api/admin/usuarios/:usuarioId/rol
export const cambiarRol = asyncHandler(async (req, res) => {
  const usuarioId = validarId(req.params.usuarioId, 'id del usuario')
  requerirCampos(req.body, ['rol'])
  const rol = validarOpcion(req.body.rol, ROLES_VALIDOS, 'El rol')

  const usuario = await buscarUsuarioPorId(usuarioId)
  if (!usuario) throw errorNoEncontrado('Usuario no encontrado.')

  // Quitarse a uno mismo el rol de admin dejaría el panel sin acceso.
  if (Number(usuarioId) === Number(req.usuario.id) && rol !== 'admin') {
    throw errorPeticion('No puedes quitarte a ti mismo el rol de administrador.')
  }

  res.status(200).json(await actualizarRol(usuarioId, rol))
})

// PUT /api/admin/usuarios/:usuarioId
export const editar = asyncHandler(async (req, res) => {
  const usuarioId = validarId(req.params.usuarioId, 'id del usuario')
  if (!(await buscarUsuarioPorId(usuarioId))) throw errorNoEncontrado('Usuario no encontrado.')

  res.status(200).json(
    await actualizarUsuario(usuarioId, {
      nombre: req.body.nombre?.trim(),
      unidad: req.body.unidad,
      telefono: req.body.telefono,
      activo: typeof req.body.activo === 'boolean' ? req.body.activo : undefined,
    }),
  )
})

// DELETE /api/admin/usuarios/:usuarioId — baja lógica.
export const desactivar = asyncHandler(async (req, res) => {
  const usuarioId = validarId(req.params.usuarioId, 'id del usuario')
  if (!(await buscarUsuarioPorId(usuarioId))) throw errorNoEncontrado('Usuario no encontrado.')

  if (Number(usuarioId) === Number(req.usuario.id)) {
    throw errorPeticion('No puedes desactivar tu propia cuenta.')
  }

  res.status(200).json(await desactivarUsuario(usuarioId))
})

// GET /api/admin/resumen — cifras del panel de administración general.
export const resumen = asyncHandler(async (_req, res) => {
  const [kpis, usuarios, negocios] = await Promise.all([
    indicadores(),
    listarUsuarios(),
    listarNegocios({ incluirInactivos: true }),
  ])

  res.status(200).json({
    kpis,
    usuarios: {
      total: usuarios.length,
      activos: usuarios.filter((u) => u.activo).length,
      porRol: ROLES_VALIDOS.map((rol) => ({ rol, cantidad: usuarios.filter((u) => u.rol === rol).length })),
    },
    marketplace: {
      total: negocios.length,
      activos: negocios.filter((n) => n.activo).length,
      destacados: negocios.filter((n) => n.destacado).length,
    },
  })
})
