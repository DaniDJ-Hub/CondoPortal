// Sprint 1 — Backend 2: "CRUD de gastos" y "Filtro de gastos por categoría".

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { levantarApi } from './ayudas.js'

describe('Gastos · CRUD y filtros', () => {
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

  test('consultar exige sesión', async () => {
    const { estado } = await api.peticion('/gastos')
    assert.equal(estado, 401)
  })

  test('lista los gastos con total y cantidad', async () => {
    const { estado, datos } = await api.peticion('/gastos', { token: tokenResidente })

    assert.equal(estado, 200)
    assert.equal(datos.cantidad, datos.gastos.length)
    assert.ok(datos.total > 0)
    assert.equal(
      datos.total,
      Math.round(datos.gastos.reduce((t, g) => t + g.monto, 0) * 100) / 100,
    )
  })

  test('filtra por categoría', async () => {
    const { datos } = await api.peticion('/gastos?categoria=seguridad', { token: tokenResidente })

    assert.ok(datos.cantidad > 0)
    assert.ok(datos.gastos.every((g) => g.categoria === 'seguridad'))
  })

  test('rechaza una categoría que no existe', async () => {
    const { estado, datos } = await api.peticion('/gastos?categoria=viajes', { token: tokenResidente })
    assert.equal(estado, 400)
    assert.match(datos.error, /categoría inválido/i)
  })

  test('filtra por rango de fechas', async () => {
    const { datos } = await api.peticion('/gastos?desde=2026-08-01&hasta=2026-08-31', { token: tokenResidente })

    assert.ok(datos.cantidad > 0)
    assert.ok(datos.gastos.every((g) => g.fecha >= '2026-08-01' && g.fecha <= '2026-08-31'))
  })

  test('el catálogo de categorías incluye el resumen con porcentajes', async () => {
    const { estado, datos } = await api.peticion('/gastos/categorias', { token: tokenResidente })

    assert.equal(estado, 200)
    assert.ok(datos.categorias.some((c) => c.valor === 'mantenimiento'))
    assert.ok(datos.resumen.every((r) => r.porcentaje >= 0 && r.porcentaje <= 100))
  })

  describe('Escritura', () => {
    let creadoId

    test('un residente no puede registrar gastos', async () => {
      const { estado } = await api.peticion('/gastos', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: { descripcion: 'Intento', categoria: 'otros', monto: 100 },
      })
      assert.equal(estado, 403)
    })

    test('el admin crea un gasto', async () => {
      const { estado, datos } = await api.peticion('/gastos', {
        metodo: 'POST',
        token: tokenAdmin,
        cuerpo: { descripcion: 'Cambio de luminarias', categoria: 'mantenimiento', monto: 2450.5, fecha: '2026-09-09' },
      })

      assert.equal(estado, 201)
      assert.equal(datos.monto, 2450.5)
      assert.equal(datos.creadoPor, 1, 'debe registrar quién lo dio de alta')
      creadoId = datos.id
    })

    test('valida monto y fecha', async () => {
      const { estado: montoMalo } = await api.peticion('/gastos', {
        metodo: 'POST',
        token: tokenAdmin,
        cuerpo: { descripcion: 'X', categoria: 'otros', monto: -5 },
      })
      assert.equal(montoMalo, 400)

      const { estado: fechaMala } = await api.peticion('/gastos', {
        metodo: 'POST',
        token: tokenAdmin,
        cuerpo: { descripcion: 'X', categoria: 'otros', monto: 5, fecha: '09-09-2026' },
      })
      assert.equal(fechaMala, 400)
    })

    test('edita un gasto existente', async () => {
      const { estado, datos } = await api.peticion(`/gastos/${creadoId}`, {
        metodo: 'PUT',
        token: tokenAdmin,
        cuerpo: { monto: 2600, categoria: 'servicios' },
      })

      assert.equal(estado, 200)
      assert.equal(datos.monto, 2600)
      assert.equal(datos.categoria, 'servicios')
      assert.equal(datos.descripcion, 'Cambio de luminarias', 'no debe borrar los campos omitidos')
    })

    test('elimina el gasto y deja de encontrarlo', async () => {
      const { estado } = await api.peticion(`/gastos/${creadoId}`, { metodo: 'DELETE', token: tokenAdmin })
      assert.equal(estado, 204)

      const { estado: busqueda } = await api.peticion(`/gastos/${creadoId}`, { token: tokenAdmin })
      assert.equal(busqueda, 404)
    })

    test('borrar un gasto inexistente responde 404', async () => {
      const { estado } = await api.peticion('/gastos/9999', { metodo: 'DELETE', token: tokenAdmin })
      assert.equal(estado, 404)
    })
  })
})
