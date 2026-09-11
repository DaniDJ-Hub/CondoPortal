// Formateadores compartidos por todas las vistas.
//
// Se crean una sola vez: `Intl.NumberFormat` es caro de construir y las tablas
// lo usan por celda.

const moneda = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
})

const monedaCorta = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  maximumFractionDigits: 0,
})

const fechaLarga = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
const fechaCorta = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
const numero = new Intl.NumberFormat('es-MX')

export const fmtMoneda = (valor) => moneda.format(Number(valor) || 0)
export const fmtMonedaCorta = (valor) => monedaCorta.format(Number(valor) || 0)
export const fmtNumero = (valor) => numero.format(Number(valor) || 0)
export const fmtPorcentaje = (valor) => `${(Number(valor) || 0).toFixed(1).replace(/\.0$/, '')} %`

// Acepta 'AAAA-MM-DD' y también fechas ISO completas.
function aFecha(valor) {
  if (!valor) return null
  const texto = String(valor)
  const fecha = texto.length === 10 ? new Date(`${texto}T00:00:00`) : new Date(texto)
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

export function fmtFecha(valor) {
  const fecha = aFecha(valor)
  return fecha ? fechaCorta.format(fecha) : '—'
}

export function fmtFechaLarga(valor) {
  const fecha = aFecha(valor)
  return fecha ? fechaLarga.format(fecha) : '—'
}

// "hace 3 días", "en 2 semanas"… para el feed de actividad y los vencimientos.
const UNIDADES = [
  ['year', 365 * 24 * 60 * 60],
  ['month', 30 * 24 * 60 * 60],
  ['week', 7 * 24 * 60 * 60],
  ['day', 24 * 60 * 60],
  ['hour', 60 * 60],
  ['minute', 60],
]

const relativo = new Intl.RelativeTimeFormat('es-MX', { numeric: 'auto' })

export function fmtRelativo(valor) {
  const fecha = aFecha(valor)
  if (!fecha) return '—'

  const segundos = Math.round((fecha.getTime() - Date.now()) / 1000)
  for (const [unidad, enSegundos] of UNIDADES) {
    if (Math.abs(segundos) >= enSegundos) {
      return relativo.format(Math.round(segundos / enSegundos), unidad)
    }
  }
  return relativo.format(segundos, 'second')
}

// Días que faltan (positivo) o que han pasado (negativo) hasta una fecha.
export function diasHasta(valor) {
  const fecha = aFecha(valor)
  if (!fecha) return null
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  return Math.round((fecha.getTime() - hoy.getTime()) / (24 * 60 * 60 * 1000))
}

export const iniciales = (nombre = '') =>
  nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join('')
