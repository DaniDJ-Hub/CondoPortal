// Utilidades compartidas por las pruebas de integración.
//
// Levantan la API sobre el almacén en memoria en un puerto efímero y
// devuelven un cliente `fetch` con la sesión ya iniciada.

import { reiniciarBaseDeDatosEnMemoria, cerrarBaseDeDatos } from '../src/db/index.js'
import { limpiarRevocados } from '../src/services/sesion.service.js'
import { crearApp } from '../src/app.js'

export const CREDENCIALES = {
  admin: { email: 'admin@condoportal.com', password: '123456' },
  residente: { email: 'residente@condoportal.com', password: '123456' },
}

export async function levantarApi() {
  // Cada suite arranca con la semilla intacta para no depender del orden.
  await reiniciarBaseDeDatosEnMemoria()
  limpiarRevocados()

  const servidor = await new Promise((resolve) => {
    const s = crearApp().listen(0, () => resolve(s))
  })
  const base = `http://127.0.0.1:${servidor.address().port}/api`

  async function peticion(ruta, { metodo = 'GET', cuerpo, token } = {}) {
    const respuesta = await fetch(`${base}${ruta}`, {
      method: metodo,
      headers: {
        ...(cuerpo && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(cuerpo && { body: JSON.stringify(cuerpo) }),
    })

    const texto = await respuesta.text()
    return {
      estado: respuesta.status,
      datos: texto ? JSON.parse(texto) : null,
    }
  }

  async function iniciarSesion(rol = 'admin') {
    const { datos } = await peticion('/auth/login', { metodo: 'POST', cuerpo: CREDENCIALES[rol] })
    return datos.token
  }

  async function cerrar() {
    await new Promise((resolve) => servidor.close(resolve))
    await cerrarBaseDeDatos()
  }

  return { peticion, iniciarSesion, cerrar }
}
