// Sprint 4 — Full-Stack/QA: "Desarrollo del Backend/API del marketplace para
// negocios y proveedores", y "Puntos de interés cercanos" del mapa.

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { levantarApi } from './ayudas.js'

describe('Marketplace y mapa', () => {
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

  describe('Directorio de negocios', () => {
    test('es público: la landing lo lista sin sesión', async () => {
      const { estado, datos } = await api.peticion('/marketplace/negocios')
      assert.equal(estado, 200)
      assert.ok(datos.cantidad > 0)
    })

    test('cada negocio trae su calificación promedio y el conteo de reseñas', async () => {
      const { datos } = await api.peticion('/marketplace/negocios')
      const conResenas = datos.negocios.find((n) => n.totalResenas > 0)

      assert.ok(conResenas, 'la semilla incluye negocios con reseñas')
      assert.ok(conResenas.calificacion >= 1 && conResenas.calificacion <= 5)

      const sinResenas = datos.negocios.find((n) => n.totalResenas === 0)
      if (sinResenas) assert.equal(sinResenas.calificacion, null)
    })

    test('filtra por categoría y por texto libre', async () => {
      const { datos: porCategoria } = await api.peticion('/marketplace/negocios?categoria=alimentos')
      assert.ok(porCategoria.cantidad > 0)
      assert.ok(porCategoria.negocios.every((n) => n.categoria === 'alimentos'))

      const { datos: porTexto } = await api.peticion('/marketplace/negocios?busqueda=pan')
      assert.ok(porTexto.negocios.some((n) => n.nombre.includes('Espiga')))
    })

    test('filtra los destacados', async () => {
      const { datos } = await api.peticion('/marketplace/negocios?destacados=true')
      assert.ok(datos.cantidad > 0)
      assert.ok(datos.negocios.every((n) => n.destacado))
    })

    test('rechaza una categoría inexistente', async () => {
      const { estado } = await api.peticion('/marketplace/negocios?categoria=naves')
      assert.equal(estado, 400)
    })

    test('el catálogo de categorías trae el conteo por rubro', async () => {
      const { estado, datos } = await api.peticion('/marketplace/categorias')
      assert.equal(estado, 200)
      assert.ok(datos.resumen.every((c) => c.cantidad > 0))
    })
  })

  describe('Perfil de proveedor', () => {
    test('incluye las reseñas con el nombre de quien opinó', async () => {
      const { estado, datos } = await api.peticion('/marketplace/negocios/1')

      assert.equal(estado, 200)
      assert.equal(datos.nombre, 'Servicios Vega')
      assert.ok(datos.resenas.length > 0)
      assert.ok(datos.resenas.every((r) => typeof r.autor === 'string' && r.autor.length > 0))
    })

    test('un negocio inexistente responde 404', async () => {
      const { estado } = await api.peticion('/marketplace/negocios/999')
      assert.equal(estado, 404)
    })
  })

  describe('Alta y edición', () => {
    let nuevoId

    test('un residente no puede publicar negocios', async () => {
      const { estado } = await api.peticion('/marketplace/negocios', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: { nombre: 'Mi changarro', categoria: 'otros' },
      })
      assert.equal(estado, 403)
    })

    test('el admin publica un negocio', async () => {
      const { estado, datos } = await api.peticion('/marketplace/negocios', {
        metodo: 'POST',
        token: tokenAdmin,
        cuerpo: { nombre: 'Tintorería Express', categoria: 'hogar', descripcion: 'Servicio en 24 horas.' },
      })

      assert.equal(estado, 201)
      assert.equal(datos.etiquetaCategoria, 'Servicios del hogar')
      assert.equal(datos.destacado, false)
      assert.equal(datos.totalResenas, 0)
      nuevoId = datos.id
    })

    test('edita el negocio recién creado', async () => {
      const { estado, datos } = await api.peticion(`/marketplace/negocios/${nuevoId}`, {
        metodo: 'PUT',
        token: tokenAdmin,
        cuerpo: { horario: 'Lun a Vie · 9:00 a 18:00', destacado: true },
      })

      assert.equal(estado, 200)
      assert.equal(datos.horario, 'Lun a Vie · 9:00 a 18:00')
      assert.equal(datos.destacado, true)
    })
  })

  describe('Reseñas', () => {
    test('publicar exige sesión', async () => {
      const { estado } = await api.peticion('/marketplace/negocios/3/resenas', {
        metodo: 'POST',
        cuerpo: { calificacion: 5 },
      })
      assert.equal(estado, 401)
    })

    test('valida el rango de la calificación', async () => {
      const { estado, datos } = await api.peticion('/marketplace/negocios/3/resenas', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: { calificacion: 9 },
      })
      assert.equal(estado, 400)
      assert.match(datos.error, /del 1 al 5/)
    })

    test('una segunda reseña del mismo usuario actualiza la anterior', async () => {
      const { datos: primera } = await api.peticion('/marketplace/negocios/6/resenas', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: { calificacion: 3, comentario: 'Buen café, servicio lento.' },
      })
      assert.equal(primera.totalResenas, 1)

      const { datos: segunda } = await api.peticion('/marketplace/negocios/6/resenas', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: { calificacion: 5, comentario: 'Mejoraron mucho el servicio.' },
      })

      assert.equal(segunda.totalResenas, 1, 'no debe duplicar la reseña')
      assert.equal(segunda.calificacion, 5)
    })
  })

  describe('Puntos de interés', () => {
    test('llegan ordenados por cercanía, con emblema y etiqueta', async () => {
      const { estado, datos } = await api.peticion('/mapa/puntos-interes')

      assert.equal(estado, 200)
      const distancias = datos.puntos.map((p) => p.distanciaM)
      assert.deepEqual(distancias, [...distancias].sort((a, b) => a - b))
      assert.ok(datos.puntos.every((p) => p.emblema && p.etiquetaCategoria))
    })

    test('las coordenadas caben en el plano de 0 a 100', async () => {
      const { datos } = await api.peticion('/mapa/puntos-interes')
      assert.ok(datos.puntos.every((p) => p.x >= 0 && p.x <= 100 && p.y >= 0 && p.y <= 100))
    })

    test('filtra por categoría y por radio', async () => {
      const { datos: amenidades } = await api.peticion('/mapa/puntos-interes?categoria=amenidad')
      assert.ok(amenidades.puntos.every((p) => p.categoria === 'amenidad'))

      const { datos: todos } = await api.peticion('/mapa/puntos-interes')
      const { datos: cercanos } = await api.peticion('/mapa/puntos-interes?radio=200')

      assert.ok(cercanos.puntos.every((p) => p.distanciaM <= 200))
      assert.ok(cercanos.cantidad < todos.cantidad, 'el radio debe dejar fuera los puntos lejanos')
      assert.ok(amenidades.cantidad > 0)
    })

    test('un punto inexistente responde 404', async () => {
      const { estado } = await api.peticion('/mapa/puntos-interes/999')
      assert.equal(estado, 404)
    })
  })
})
