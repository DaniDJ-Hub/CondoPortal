// Sprint 5 — Backend 1: "Gestión de usuarios y roles" y el resumen que
// alimenta el panel de administración general (Full-Stack/QA).

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { levantarApi } from './ayudas.js'

describe('Administración · usuarios y roles', () => {
  let api
  let tokenAdmin
  let tokenResidente

  before(async () => {
    api = await levantarApi()
    tokenAdmin = await api.iniciarSesion('admin')
    tokenResidente = await api.iniciarSesion('residente')
  })
  after(async () => {
    await api.cerrar()
  })

  test('todo el panel exige rol de administrador', async () => {
    const { estado: sinSesion } = await api.peticion('/admin/usuarios')
    assert.equal(sinSesion, 401)

    const { estado: comoResidente } = await api.peticion('/admin/usuarios', { token: tokenResidente })
    assert.equal(comoResidente, 403)
  })

  test('lista los usuarios con el desglose por rol y sin exponer contraseñas', async () => {
    const { estado, datos } = await api.peticion('/admin/usuarios', { token: tokenAdmin })

    assert.equal(estado, 200)
    assert.equal(datos.cantidad, datos.usuarios.length)
    assert.ok(datos.usuarios.every((u) => u.passwordHash === undefined))

    const total = datos.porRol.reduce((t, r) => t + r.cantidad, 0)
    assert.equal(total, datos.cantidad)
  })

  test('filtra por rol', async () => {
    const { datos } = await api.peticion('/admin/usuarios?rol=residente', { token: tokenAdmin })
    assert.ok(datos.cantidad > 0)
    assert.ok(datos.usuarios.every((u) => u.rol === 'residente'))
  })

  describe('Cambio de rol', () => {
    test('promueve a un residente y el cambio persiste', async () => {
      const { estado, datos } = await api.peticion('/admin/usuarios/3/rol', {
        metodo: 'PATCH',
        token: tokenAdmin,
        cuerpo: { rol: 'proveedor' },
      })

      assert.equal(estado, 200)
      assert.equal(datos.rol, 'proveedor')

      const { datos: releido } = await api.peticion('/admin/usuarios/3', { token: tokenAdmin })
      assert.equal(releido.rol, 'proveedor')
    })

    test('rechaza un rol que no existe', async () => {
      const { estado, datos } = await api.peticion('/admin/usuarios/3/rol', {
        metodo: 'PATCH',
        token: tokenAdmin,
        cuerpo: { rol: 'superusuario' },
      })
      assert.equal(estado, 400)
      assert.match(datos.error, /rol inválido/i)
    })

    test('el admin no puede quitarse a sí mismo el rol de administrador', async () => {
      const { estado, datos } = await api.peticion('/admin/usuarios/1/rol', {
        metodo: 'PATCH',
        token: tokenAdmin,
        cuerpo: { rol: 'residente' },
      })
      assert.equal(estado, 400)
      assert.match(datos.error, /a ti mismo/i)
    })

    test('un usuario inexistente responde 404', async () => {
      const { estado } = await api.peticion('/admin/usuarios/999/rol', {
        metodo: 'PATCH',
        token: tokenAdmin,
        cuerpo: { rol: 'residente' },
      })
      assert.equal(estado, 404)
    })
  })

  describe('Alta y baja', () => {
    test('da de alta un usuario desde el panel', async () => {
      const { estado, datos } = await api.peticion('/admin/usuarios', {
        metodo: 'POST',
        token: tokenAdmin,
        cuerpo: {
          nombre: 'Carlos Peña',
          email: 'carlos@condoportal.com',
          password: 'clave-segura',
          rol: 'residente',
          unidad: 'C-401',
        },
      })

      assert.equal(estado, 201)
      assert.equal(datos.unidad, 'C-401')
      assert.equal(datos.activo, true)
    })

    test('no duplica correos', async () => {
      const { estado } = await api.peticion('/admin/usuarios', {
        metodo: 'POST',
        token: tokenAdmin,
        cuerpo: { nombre: 'Otro', email: 'carlos@condoportal.com', password: 'clave-segura', rol: 'residente' },
      })
      assert.equal(estado, 409)
    })

    test('la baja es lógica y bloquea el acceso de esa cuenta', async () => {
      const { datos } = await api.peticion('/admin/usuarios', {
        metodo: 'POST',
        token: tokenAdmin,
        cuerpo: { nombre: 'Temporal', email: 'temporal@condoportal.com', password: 'clave-segura', rol: 'residente' },
      })

      const { estado, datos: dadoDeBaja } = await api.peticion(`/admin/usuarios/${datos.id}`, {
        metodo: 'DELETE',
        token: tokenAdmin,
      })
      assert.equal(estado, 200)
      assert.equal(dadoDeBaja.activo, false)

      const { estado: intentoLogin, datos: error } = await api.peticion('/auth/login', {
        metodo: 'POST',
        cuerpo: { email: 'temporal@condoportal.com', password: 'clave-segura' },
      })
      assert.equal(intentoLogin, 403)
      assert.match(error.error, /desactivada/i)
    })

    test('el admin no puede desactivarse a sí mismo', async () => {
      const { estado } = await api.peticion('/admin/usuarios/1', { metodo: 'DELETE', token: tokenAdmin })
      assert.equal(estado, 400)
    })
  })

  test('el resumen del panel cuadra con la lista de usuarios', async () => {
    const { estado, datos } = await api.peticion('/admin/resumen', { token: tokenAdmin })
    const { datos: lista } = await api.peticion('/admin/usuarios', { token: tokenAdmin })

    assert.equal(estado, 200)
    assert.equal(datos.usuarios.total, lista.cantidad)
    assert.ok(datos.usuarios.activos <= datos.usuarios.total)
    assert.ok(datos.marketplace.total > 0)
    assert.ok(typeof datos.kpis.saldoActual === 'number')
  })
})
