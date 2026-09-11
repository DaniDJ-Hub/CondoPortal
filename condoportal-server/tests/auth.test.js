// Sprint 1 — "Crear endpoint de autenticación" (Backend 1),
// "Manejo de sesión (token/logout)" (Backend 2) y
// Sprint 4 — "Registro de nuevos usuarios" (Backend 1).

import { test, describe, before, after, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { levantarApi, CREDENCIALES } from './ayudas.js'

describe('Autenticación y sesión', () => {
  let api

  before(async () => {
    api = await levantarApi()
  })
  after(async () => {
    await api.cerrar()
  })

  describe('Login', () => {
    test('entrega token y usuario con credenciales correctas', async () => {
      const { estado, datos } = await api.peticion('/auth/login', {
        metodo: 'POST',
        cuerpo: CREDENCIALES.residente,
      })

      assert.equal(estado, 200)
      assert.ok(datos.token)
      assert.equal(datos.usuario.email, CREDENCIALES.residente.email)
      assert.equal(datos.usuario.passwordHash, undefined, 'el hash nunca debe salir en la respuesta')
    })

    test('rechaza contraseña incorrecta sin revelar si el correo existe', async () => {
      const { estado: conCorreoReal, datos: mensajeReal } = await api.peticion('/auth/login', {
        metodo: 'POST',
        cuerpo: { email: CREDENCIALES.admin.email, password: 'incorrecta' },
      })
      const { estado: conCorreoFalso, datos: mensajeFalso } = await api.peticion('/auth/login', {
        metodo: 'POST',
        cuerpo: { email: 'nadie@condoportal.com', password: 'incorrecta' },
      })

      assert.equal(conCorreoReal, 401)
      assert.equal(conCorreoFalso, 401)
      assert.equal(mensajeReal.error, mensajeFalso.error)
    })

    test('exige los campos obligatorios y valida el formato del correo', async () => {
      const { estado: sinCampos, datos } = await api.peticion('/auth/login', { metodo: 'POST', cuerpo: {} })
      assert.equal(sinCampos, 400)
      assert.deepEqual(datos.detalles.campos, ['email', 'password'])

      const { estado: malFormato } = await api.peticion('/auth/login', {
        metodo: 'POST',
        cuerpo: { email: 'no-es-correo', password: '123456' },
      })
      assert.equal(malFormato, 400)
    })
  })

  describe('Sesión', () => {
    let token

    beforeEach(async () => {
      token = await api.iniciarSesion('residente')
    })

    test('/auth/me devuelve el usuario de la sesión activa', async () => {
      const { estado, datos } = await api.peticion('/auth/me', { token })
      assert.equal(estado, 200)
      assert.equal(datos.usuario.email, CREDENCIALES.residente.email)
    })

    test('el logout invalida el token aunque siga vigente', async () => {
      const { estado: antes } = await api.peticion('/auth/me', { token })
      assert.equal(antes, 200)

      const { estado: cierre } = await api.peticion('/auth/logout', { metodo: 'POST', token })
      assert.equal(cierre, 200)

      const { estado: despues, datos } = await api.peticion('/auth/me', { token })
      assert.equal(despues, 401)
      assert.equal(datos.codigo, 'TOKEN_REVOCADO')
    })

    test('renovar entrega un token nuevo y retira el anterior', async () => {
      const { estado, datos } = await api.peticion('/auth/renovar', { metodo: 'POST', token })
      assert.equal(estado, 200)
      assert.notEqual(datos.token, token)

      const { estado: conNuevo } = await api.peticion('/auth/me', { token: datos.token })
      assert.equal(conNuevo, 200)

      const { estado: conViejo } = await api.peticion('/auth/me', { token })
      assert.equal(conViejo, 401)
    })
  })

  describe('Registro de nuevos usuarios', () => {
    const nuevo = {
      nombre: 'Vecina Nueva',
      email: 'vecina@condoportal.com',
      password: 'clave-seguraf',
      unidad: 'C-105',
    }

    test('da de alta al usuario y lo deja con sesión iniciada', async () => {
      const { estado, datos } = await api.peticion('/auth/registro', { metodo: 'POST', cuerpo: nuevo })

      assert.equal(estado, 201)
      assert.equal(datos.usuario.email, nuevo.email)
      assert.equal(datos.usuario.rol, 'residente')
      assert.ok(datos.token)

      const { estado: sesion } = await api.peticion('/auth/me', { token: datos.token })
      assert.equal(sesion, 200)
    })

    test('no permite dos cuentas con el mismo correo', async () => {
      const { estado, datos } = await api.peticion('/auth/registro', { metodo: 'POST', cuerpo: nuevo })
      assert.equal(estado, 409)
      assert.match(datos.error, /ya existe/i)
    })

    test('rechaza contraseñas demasiado cortas', async () => {
      const { estado, datos } = await api.peticion('/auth/registro', {
        metodo: 'POST',
        cuerpo: { ...nuevo, email: 'otra@condoportal.com', password: '123' },
      })
      assert.equal(estado, 400)
      assert.match(datos.error, /6 caracteres/)
    })

    test('el alta pública no deja auto-asignarse el rol de admin', async () => {
      const { datos } = await api.peticion('/auth/registro', {
        metodo: 'POST',
        cuerpo: { ...nuevo, email: 'colada@condoportal.com', rol: 'admin' },
      })
      assert.equal(datos.usuario.rol, 'residente')
    })

    test('un admin autenticado sí puede elegir el rol', async () => {
      const tokenAdmin = await api.iniciarSesion('admin')
      const { estado, datos } = await api.peticion('/auth/registro', {
        metodo: 'POST',
        token: tokenAdmin,
        cuerpo: { ...nuevo, email: 'proveedor.nuevo@condoportal.com', rol: 'proveedor' },
      })

      assert.equal(estado, 201)
      assert.equal(datos.usuario.rol, 'proveedor')
    })
  })
})
