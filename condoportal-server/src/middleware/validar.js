// Validaciones reutilizables de la entrada de las peticiones.
//
// Devuelven mensajes en español listos para mostrarse en el formulario que
// originó la petición, en vez de un error genérico.

import { errorPeticion } from './errorHandler.js'

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const RE_FECHA = /^\d{4}-\d{2}-\d{2}$/

export function requerirCampos(cuerpo, campos) {
  const faltantes = campos.filter((campo) => {
    const valor = cuerpo?.[campo]
    return valor === undefined || valor === null || String(valor).trim() === ''
  })
  if (faltantes.length > 0) {
    throw errorPeticion(
      `Faltan campos obligatorios: ${faltantes.join(', ')}.`,
      { campos: faltantes },
    )
  }
}

export function validarEmail(email) {
  const limpio = String(email).trim().toLowerCase()
  if (!RE_EMAIL.test(limpio)) throw errorPeticion('El correo electrónico no tiene un formato válido.')
  return limpio
}

export function validarPassword(password) {
  const texto = String(password)
  if (texto.length < 6) throw errorPeticion('La contraseña debe tener al menos 6 caracteres.')
  return texto
}

export function validarMonto(monto, etiqueta = 'monto') {
  const numero = Number(monto)
  if (!Number.isFinite(numero) || numero <= 0) {
    throw errorPeticion(`El ${etiqueta} debe ser un número mayor que cero.`)
  }
  return Math.round(numero * 100) / 100
}

export function validarOpcion(valor, opciones, etiqueta) {
  if (!opciones.includes(valor)) {
    throw errorPeticion(`${etiqueta} inválido. Usa uno de: ${opciones.join(', ')}.`)
  }
  return valor
}

export function validarFecha(fecha, etiqueta = 'fecha') {
  if (!RE_FECHA.test(String(fecha))) {
    throw errorPeticion(`La ${etiqueta} debe tener el formato AAAA-MM-DD.`)
  }
  if (Number.isNaN(new Date(`${fecha}T00:00:00Z`).getTime())) {
    throw errorPeticion(`La ${etiqueta} no corresponde a un día válido.`)
  }
  return fecha
}

export function validarId(valor, etiqueta = 'identificador') {
  const numero = Number(valor)
  if (!Number.isInteger(numero) || numero <= 0) {
    throw errorPeticion(`El ${etiqueta} debe ser un número entero positivo.`)
  }
  return numero
}
