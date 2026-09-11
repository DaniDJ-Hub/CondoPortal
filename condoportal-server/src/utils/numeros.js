// Utilidades numéricas compartidas por los modelos.
//
// PostgreSQL devuelve las columnas NUMERIC como cadena para no perder
// precisión, mientras que el almacén en memoria guarda números. Los modelos
// normalizan con `aNumero` para que la API responda siempre el mismo tipo.

export function aNumero(valor, porDefecto = 0) {
  const numero = typeof valor === 'number' ? valor : Number.parseFloat(valor)
  return Number.isFinite(numero) ? numero : porDefecto
}

// Redondea a centavos evitando los arrastres de coma flotante
// (0.1 + 0.2 -> 0.30000000000000004).
export function aPesos(valor) {
  return Math.round(aNumero(valor) * 100) / 100
}

export function sumarPor(filas, campo) {
  return aPesos(filas.reduce((total, fila) => total + aNumero(fila[campo]), 0))
}

// Convierte una fecha (Date, ISO o 'YYYY-MM-DD') a la clave de mes 'YYYY-MM'.
export function claveDeMes(fecha) {
  if (!fecha) return ''
  const texto = fecha instanceof Date ? fecha.toISOString() : String(fecha)
  return texto.slice(0, 7)
}

export function aFechaISO(fecha) {
  if (!fecha) return null
  if (fecha instanceof Date) return fecha.toISOString().slice(0, 10)
  return String(fecha).slice(0, 10)
}

export function aInstanteISO(fecha) {
  if (!fecha) return null
  return fecha instanceof Date ? fecha.toISOString() : new Date(fecha).toISOString()
}
