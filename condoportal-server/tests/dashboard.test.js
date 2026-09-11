// Sprint 3 — Full-Stack/QA: "Pruebas de integración del dashboard".
//
// Cubren el contrato completo de /api/dashboard: autenticación, forma de la
// respuesta, coherencia entre los KPIs y el flujo de caja, y el feed de
// actividad que consume la vista.

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { levantarApi } from './ayudas.js'

describe('Dashboard · integración', () => {
  let api
  let token

  before(async () => {
    api = await levantarApi()
    token = await api.iniciarSesion('admin')
  })

  after(async () => {
    await api.cerrar()
  })

  test('rechaza las peticiones sin token', async () => {
    const { estado, datos } = await api.peticion('/dashboard')
    assert.equal(estado, 401)
    assert.match(datos.error, /token/i)
  })

  test('rechaza un token con firma inválida', async () => {
    const { estado, datos } = await api.peticion('/dashboard', { token: 'no-es-un-token' })
    assert.equal(estado, 401)
    assert.equal(datos.codigo, 'TOKEN_INVALIDO')
  })

  test('el resumen trae las cuatro secciones que consume la vista', async () => {
    const { estado, datos } = await api.peticion('/dashboard', { token })

    assert.equal(estado, 200)
    assert.ok(datos.kpis, 'faltan los KPIs')
    assert.ok(Array.isArray(datos.flujo.serie), 'el flujo debe traer una serie')
    assert.ok(Array.isArray(datos.actividad), 'falta el feed de actividad')
    assert.ok(Array.isArray(datos.gastosPorCategoria), 'falta el desglose por categoría')
  })

  describe('KPIs', () => {
    test('exponen los indicadores del tablero con tipos numéricos', async () => {
      const { datos } = await api.peticion('/dashboard/kpis', { token })

      for (const campo of ['saldoActual', 'totalIngresos', 'totalEgresos', 'porCobrar', 'tasaMorosidad']) {
        assert.equal(typeof datos[campo], 'number', `${campo} debería ser numérico`)
      }
      assert.ok(datos.totalEgresos > 0, 'la semilla incluye gastos')
      assert.equal(datos.saldoActual, Math.round((datos.totalIngresos - datos.totalEgresos) * 100) / 100)
    })

    test('la morosidad nunca excede el total de residentes', async () => {
      const { datos } = await api.peticion('/dashboard/kpis', { token })
      assert.ok(datos.residentesMorosos <= datos.residentes)
      assert.ok(datos.tasaMorosidad >= 0 && datos.tasaMorosidad <= 100)
    })

    test('la semilla deja al menos una cuota vencida por cobrar', async () => {
      const { datos } = await api.peticion('/dashboard/kpis', { token })
      assert.ok(datos.cuotasVencidas > 0, 'la unidad B-302 arrastra cuotas vencidas')
      assert.ok(datos.porCobrar > 0)
    })
  })

  describe('Flujo de caja', () => {
    test('devuelve la cantidad de meses solicitada, en orden cronológico', async () => {
      const { datos } = await api.peticion('/dashboard/flujo-caja?meses=4', { token })

      assert.equal(datos.serie.length, 4)
      const meses = datos.serie.map((p) => p.mes)
      assert.deepEqual(meses, [...meses].sort(), 'los meses deben ir de más antiguo a más reciente')
    })

    test('acota el parámetro meses a un rango razonable', async () => {
      const { datos: enorme } = await api.peticion('/dashboard/flujo-caja?meses=999', { token })
      const { datos: negativo } = await api.peticion('/dashboard/flujo-caja?meses=-3', { token })
      const { datos: basura } = await api.peticion('/dashboard/flujo-caja?meses=abc', { token })

      assert.equal(enorme.serie.length, 24)
      assert.equal(negativo.serie.length, 3)
      assert.equal(basura.serie.length, 6, 'un valor no numérico cae al valor por omisión')
    })

    test('el saldo de cada punto acumula el neto del anterior', async () => {
      const { datos } = await api.peticion('/dashboard/flujo-caja?meses=6', { token })

      datos.serie.forEach((punto, i) => {
        assert.equal(punto.neto, Math.round((punto.ingresos - punto.egresos) * 100) / 100)
        if (i === 0) return
        const esperado = Math.round((datos.serie[i - 1].saldo + punto.neto) * 100) / 100
        assert.equal(punto.saldo, esperado, `el saldo de ${punto.mes} no acumula`)
      })
    })

    test('los totales coinciden con la suma de la serie', async () => {
      const { datos } = await api.peticion('/dashboard/flujo-caja?meses=6', { token })
      const sumar = (campo) =>
        Math.round(datos.serie.reduce((t, p) => t + p[campo], 0) * 100) / 100

      assert.equal(datos.totales.ingresos, sumar('ingresos'))
      assert.equal(datos.totales.egresos, sumar('egresos'))
      assert.equal(datos.totales.saldoFinal, datos.serie.at(-1).saldo)
    })

    test('cada punto trae una etiqueta legible para el eje', async () => {
      const { datos } = await api.peticion('/dashboard/flujo-caja', { token })
      for (const punto of datos.serie) {
        assert.match(punto.etiqueta, /^[A-Za-zÁÉÍÓÚáéíóú]{3} \d{2}$/, `etiqueta inesperada: ${punto.etiqueta}`)
      }
    })
  })

  describe('Actividad reciente', () => {
    test('llega ordenada de más nueva a más vieja y respeta el límite', async () => {
      const { datos } = await api.peticion('/dashboard/actividad?limite=5', { token })

      assert.equal(datos.actividad.length, 5)
      const fechas = datos.actividad.map((e) => e.fecha)
      assert.deepEqual(fechas, [...fechas].sort().reverse())
    })

    test('cada evento trae los campos que pinta la vista', async () => {
      const { datos } = await api.peticion('/dashboard/actividad', { token })

      for (const evento of datos.actividad) {
        assert.ok(evento.id, 'el evento necesita id para la key de React')
        assert.ok(['pago', 'gasto', 'usuario', 'negocio'].includes(evento.tipo))
        assert.equal(typeof evento.titulo, 'string')
        assert.ok([1, -1, 0].includes(evento.signo))
      }
    })

    test('mezcla eventos de varias fuentes', async () => {
      const { datos } = await api.peticion('/dashboard/actividad?limite=50', { token })
      const tipos = new Set(datos.actividad.map((e) => e.tipo))
      assert.ok(tipos.size > 1, `se esperaban varios tipos de evento, llegó: ${[...tipos]}`)
    })
  })

  describe('Coherencia entre secciones', () => {
    test('los KPIs y el flujo reportan el mismo mes en curso', async () => {
      const { datos } = await api.peticion('/dashboard?meses=6', { token })
      assert.equal(datos.kpis.mesActual, datos.flujo.serie.at(-1).mes)
      assert.equal(datos.kpis.ingresosDelMes, datos.flujo.serie.at(-1).ingresos)
    })

    test('el desglose por categoría suma 100 % y cuadra con los egresos', async () => {
      const { datos } = await api.peticion('/dashboard', { token })

      const suma = Math.round(datos.gastosPorCategoria.reduce((t, c) => t + c.total, 0) * 100) / 100
      assert.equal(suma, datos.kpis.totalEgresos)

      const porcentajes = datos.gastosPorCategoria.reduce((t, c) => t + c.porcentaje, 0)
      assert.ok(Math.abs(porcentajes - 100) < 0.5, `los porcentajes suman ${porcentajes}`)
    })

    test('un pago nuevo se refleja en los KPIs del dashboard', async () => {
      const { datos: antes } = await api.peticion('/dashboard/kpis', { token })

      const { estado } = await api.peticion('/pagos/pagar', {
        metodo: 'POST',
        token,
        cuerpo: { usuarioId: 4, monto: 500, concepto: 'Abono de prueba', metodo: 'efectivo' },
      })
      assert.equal(estado, 201)

      const { datos: despues } = await api.peticion('/dashboard/kpis', { token })
      assert.equal(despues.totalIngresos, Math.round((antes.totalIngresos + 500) * 100) / 100)
      assert.ok(despues.porCobrar < antes.porCobrar, 'el abono debe reducir lo que falta por cobrar')
    })
  })
})
