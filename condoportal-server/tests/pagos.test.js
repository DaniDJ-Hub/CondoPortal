// Sprint 2 — Backend 2: "Flujo de pago de cuota" y "Actualizar estado de
// cuenta tras pago". Backend 1: "Generar recibo de pago".

import { test, describe, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { levantarApi } from './ayudas.js'

describe('Pagos · flujo de cuota y estado de cuenta', () => {
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

  test('el estado de cuenta sin parámetros es el del usuario autenticado', async () => {
    const { estado, datos } = await api.peticion('/pagos/estado-cuenta', { token: tokenResidente })

    assert.equal(estado, 200)
    assert.equal(datos.usuarioId, 2)
    assert.ok(datos.saldoPendiente > 0, 'el residente demo tiene cuotas abiertas')
    assert.ok(Array.isArray(datos.cuotas))
    assert.ok(datos.proximaCuota, 'debe señalar la próxima cuota por pagar')
  })

  test('un residente no puede ver el estado de cuenta de otro', async () => {
    const { estado } = await api.peticion('/pagos/estado-cuenta/4', { token: tokenResidente })
    assert.equal(estado, 400)
  })

  test('el admin sí puede consultar cualquier cuenta', async () => {
    const { estado, datos } = await api.peticion('/pagos/estado-cuenta/4', { token: tokenAdmin })
    assert.equal(estado, 200)
    assert.equal(datos.usuarioId, 4)
    assert.ok(datos.cuotasVencidas > 0)
  })

  test('el saldo de cada cuota es monto menos lo pagado', async () => {
    const { datos } = await api.peticion('/pagos/estado-cuenta', { token: tokenResidente })

    for (const cuota of datos.cuotas) {
      assert.equal(cuota.saldo, Math.round(Math.max(0, cuota.monto - cuota.pagado) * 100) / 100)
      if (cuota.saldo === 0) assert.equal(cuota.estatus, 'pagada')
    }
  })

  describe('Pagar una cuota', () => {
    test('un pago parcial deja la cuota en estatus parcial', async () => {
      const { datos: antes } = await api.peticion('/pagos/estado-cuenta', { token: tokenResidente })
      const cuota = antes.cuotas.find((c) => c.saldo > 0 && c.estatus === 'pendiente')

      const { estado, datos } = await api.peticion('/pagos/pagar', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: { monto: 500, cuotaId: cuota.id },
      })

      assert.equal(estado, 201)
      const actualizada = datos.estadoCuenta.cuotas.find((c) => c.id === cuota.id)
      assert.equal(actualizada.pagado, 500)
      assert.equal(actualizada.saldo, Math.round((cuota.monto - 500) * 100) / 100)
      assert.equal(actualizada.estatus, 'parcial')
    })

    test('aplica el pago a la cuota indicada y actualiza el estado en la misma respuesta', async () => {
      const { datos: antes } = await api.peticion('/pagos/estado-cuenta', { token: tokenResidente })
      const cuota = antes.cuotas.find((c) => c.saldo > 0)

      const { estado, datos } = await api.peticion('/pagos/pagar', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: { monto: cuota.saldo, cuotaId: cuota.id, metodo: 'tarjeta' },
      })

      assert.equal(estado, 201)
      assert.equal(datos.pagos.length, 1)
      assert.equal(datos.pagos[0].cuotaId, cuota.id)

      const actualizada = datos.estadoCuenta.cuotas.find((c) => c.id === cuota.id)
      assert.equal(actualizada.saldo, 0)
      assert.equal(actualizada.estatus, 'pagada')
      assert.equal(
        datos.estadoCuenta.saldoPendiente,
        Math.round((antes.saldoPendiente - cuota.saldo) * 100) / 100,
      )
    })

    test('sin cuotaId reparte el pago entre las cuotas abiertas, de la más antigua a la más nueva', async () => {
      const { datos: antes } = await api.peticion('/pagos/estado-cuenta/4', { token: tokenAdmin })
      const abiertas = antes.cuotas.filter((c) => c.saldo > 0).sort((a, b) => a.venceEn.localeCompare(b.venceEn))
      const parcial = Math.round((abiertas[1].saldo / 2) * 100) / 100
      const monto = Math.round((abiertas[0].saldo + parcial) * 100) / 100

      const { datos } = await api.peticion('/pagos/pagar', {
        metodo: 'POST',
        token: tokenAdmin,
        cuerpo: { usuarioId: 4, monto },
      })

      assert.equal(datos.pagos.length, 2, 'el pago se divide entre dos cuotas')
      assert.equal(datos.pagos[0].cuotaId, abiertas[0].id)
      assert.equal(datos.pagos[0].monto, abiertas[0].saldo, 'la más antigua se salda primero')
      assert.equal(datos.pagos[1].cuotaId, abiertas[1].id)
      assert.equal(datos.pagos[1].monto, parcial)

      const primera = datos.estadoCuenta.cuotas.find((c) => c.id === abiertas[0].id)
      const segunda = datos.estadoCuenta.cuotas.find((c) => c.id === abiertas[1].id)
      assert.equal(primera.estatus, 'pagada')
      assert.equal(segunda.saldo, Math.round((abiertas[1].saldo - parcial) * 100) / 100)
      // Sigue vencida: un abono parcial no la pone al corriente.
      assert.equal(segunda.estatus, 'vencida')
    })

    test('el excedente queda como abono a cuenta', async () => {
      const { datos: antes } = await api.peticion('/pagos/estado-cuenta/3', { token: tokenAdmin })
      const excedente = Math.round((antes.saldoPendiente + 750) * 100) / 100

      const { datos } = await api.peticion('/pagos/pagar', {
        metodo: 'POST',
        token: tokenAdmin,
        cuerpo: { usuarioId: 3, monto: excedente },
      })

      assert.ok(datos.pagos.some((p) => p.cuotaId === null), 'debe generar un abono sin cuota')
      assert.equal(datos.estadoCuenta.saldoPendiente, 0)
      assert.equal(datos.estadoCuenta.saldoAFavor, 750)
      assert.equal(datos.estadoCuenta.alCorriente, true)
    })

    test('valida monto y método de pago', async () => {
      const { estado: sinMonto } = await api.peticion('/pagos/pagar', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: {},
      })
      assert.equal(sinMonto, 400)

      const { estado: montoCero } = await api.peticion('/pagos/pagar', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: { monto: 0 },
      })
      assert.equal(montoCero, 400)

      const { estado: metodoInvalido, datos } = await api.peticion('/pagos/pagar', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: { monto: 100, metodo: 'bitcoin' },
      })
      assert.equal(metodoInvalido, 400)
      assert.match(datos.error, /método de pago/i)
    })

    test('no permite pagar una cuota que es de otra cuenta', async () => {
      const { estado } = await api.peticion('/pagos/pagar', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: { monto: 100, cuotaId: 8 },
      })
      assert.equal(estado, 404)
    })
  })

  describe('Recibo', () => {
    test('el pago devuelve un recibo con folio y datos del residente', async () => {
      const { datos } = await api.peticion('/pagos/pagar', {
        metodo: 'POST',
        token: tokenResidente,
        cuerpo: { monto: 300, concepto: 'Abono voluntario' },
      })

      assert.match(datos.recibo.folio, /^REC-\d{6}$/)
      assert.equal(datos.recibo.residente.unidad, 'A-101')
      assert.ok(datos.recibo.emitidoEn)
    })

    test('un residente no puede descargar el recibo de otro', async () => {
      const { datos } = await api.peticion('/pagos/pagar', {
        metodo: 'POST',
        token: tokenAdmin,
        cuerpo: { usuarioId: 4, monto: 100 },
      })

      const { estado } = await api.peticion(`/pagos/${datos.pagos[0].id}/recibo`, { token: tokenResidente })
      assert.equal(estado, 400)
    })

    test('un recibo inexistente responde 404', async () => {
      const { estado } = await api.peticion('/pagos/9999/recibo', { token: tokenAdmin })
      assert.equal(estado, 404)
    })
  })

  describe('Proyecciones financieras', () => {
    test('sólo la administración las consulta', async () => {
      const { estado } = await api.peticion('/pagos/proyecciones', { token: tokenResidente })
      assert.equal(estado, 403)
    })

    test('proyecta los meses pedidos a partir del promedio histórico', async () => {
      const { estado, datos } = await api.peticion('/pagos/proyecciones?meses=4', { token: tokenAdmin })

      assert.equal(estado, 200)
      assert.equal(datos.proyeccion.length, 4)
      assert.equal(datos.netoMensual, Math.round((datos.promedioIngresosMensual - datos.promedioEgresosMensual) * 100) / 100)

      datos.proyeccion.forEach((mes, i) => {
        if (i === 0) return
        const esperado = Math.round((datos.proyeccion[i - 1].saldoEstimado + datos.netoMensual) * 100) / 100
        assert.equal(mes.saldoEstimado, esperado)
      })
    })
  })
})

// El historial que consume Frontend 2 es un libro de movimientos, no una
// lista de pagos: por eso se prueba aparte del flujo de cobro.
describe('Historial de movimientos', () => {
  let api
  let tokenResidente

  before(async () => {
    api = await levantarApi()
    tokenResidente = await api.iniciarSesion('residente')
  })
  after(async () => {
    await api.cerrar()
  })

  test('mezcla cargos y pagos, del más reciente al más antiguo', async () => {
    const { estado, datos } = await api.peticion('/pagos/movimientos', { token: tokenResidente })

    assert.equal(estado, 200)
    const tipos = new Set(datos.movimientos.map((m) => m.tipo))
    assert.deepEqual([...tipos].sort(), ['cargo', 'pago'])

    const fechas = datos.movimientos.map((m) => m.fecha)
    assert.deepEqual(fechas, [...fechas].sort().reverse())
  })

  test('el saldo corrido cuadra con el adeudo actual', async () => {
    const { datos } = await api.peticion('/pagos/movimientos', { token: tokenResidente })
    assert.equal(datos.movimientos[0].saldo, datos.saldoActual)
  })

  test('cada movimiento trae los campos que pinta la tabla', async () => {
    const { datos } = await api.peticion('/pagos/movimientos', { token: tokenResidente })

    for (const movimiento of datos.movimientos) {
      assert.ok(movimiento.id, 'se necesita id para la key de React')
      assert.match(movimiento.fecha, /^\d{4}-\d{2}-\d{2}$/)
      assert.equal(typeof movimiento.concepto, 'string')
      assert.equal(typeof movimiento.monto, 'number')
      assert.equal(typeof movimiento.saldo, 'number')
      assert.ok(movimiento.estado)
    }
  })

  test('un pago nuevo aparece de inmediato en el historial', async () => {
    const { datos: antes } = await api.peticion('/pagos/movimientos', { token: tokenResidente })

    await api.peticion('/pagos/pagar', {
      metodo: 'POST',
      token: tokenResidente,
      cuerpo: { monto: 200, concepto: 'Abono de prueba' },
    })

    const { datos: despues } = await api.peticion('/pagos/movimientos', { token: tokenResidente })
    assert.equal(despues.movimientos.length, antes.movimientos.length + 1)
    assert.equal(despues.movimientos[0].concepto, 'Abono de prueba')
    assert.equal(despues.movimientos[0].saldo, Math.round((antes.saldoActual - 200) * 100) / 100)
  })
})
