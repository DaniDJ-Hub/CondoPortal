// Cliente centralizado de llamadas a la API.
//
// Todos los módulos (auth, gastos, pagos, etc.) importan desde aquí en vez de
// hacer fetch directo: así el token, el manejo de errores y la URL base viven
// en un solo lugar.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const CLAVE_TOKEN = 'condoportal.token'
export const CLAVE_USUARIO = 'condoportal.usuario'

// Error con el estado HTTP y el mensaje que devolvió el servidor, para que la
// vista pueda mostrar el texto real ("La contraseña debe tener…") en lugar de
// un genérico "algo salió mal".
export class ErrorApi extends Error {
  constructor(mensaje, { estado, codigo, detalles } = {}) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.estado = estado
    this.codigo = codigo
    this.detalles = detalles
  }

  get esDeSesion() {
    return this.estado === 401
  }
}

export function leerToken() {
  try {
    return localStorage.getItem(CLAVE_TOKEN)
  } catch {
    // Modo privado o almacenamiento bloqueado: se sigue sin sesión guardada.
    return null
  }
}

export function guardarSesion(token, usuario) {
  try {
    localStorage.setItem(CLAVE_TOKEN, token)
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario))
  } catch {
    // Si no se puede persistir, la sesión sigue viva sólo en memoria.
  }
}

export function borrarSesion() {
  try {
    localStorage.removeItem(CLAVE_TOKEN)
    localStorage.removeItem(CLAVE_USUARIO)
  } catch {
    // Nada que limpiar.
  }
}

export function leerUsuarioGuardado() {
  try {
    const crudo = localStorage.getItem(CLAVE_USUARIO)
    return crudo ? JSON.parse(crudo) : null
  } catch {
    return null
  }
}

// Aviso a la app de que el token dejó de servir, para cerrar sesión sin que
// cada llamada tenga que saber de rutas ni de React.
const oyentesSesionExpirada = new Set()

export function alExpirarSesion(oyente) {
  oyentesSesionExpirada.add(oyente)
  return () => oyentesSesionExpirada.delete(oyente)
}

async function peticion(ruta, { metodo = 'GET', cuerpo, señal } = {}) {
  const token = leerToken()

  let respuesta
  try {
    respuesta = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers: {
        ...(cuerpo !== undefined && { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(cuerpo !== undefined && { body: JSON.stringify(cuerpo) }),
      signal: señal,
    })
  } catch (error) {
    if (error.name === 'AbortError') throw error
    throw new ErrorApi('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.', { estado: 0 })
  }

  if (respuesta.status === 204) return null

  const texto = await respuesta.text()
  let datos = null
  if (texto) {
    try {
      datos = JSON.parse(texto)
    } catch {
      datos = null
    }
  }

  if (!respuesta.ok) {
    const error = new ErrorApi(datos?.error || `Error ${respuesta.status} al llamar a ${ruta}`, {
      estado: respuesta.status,
      codigo: datos?.codigo,
      detalles: datos?.detalles,
    })
    // Un 401 en cualquier llamada significa que la sesión ya no vale.
    if (error.esDeSesion) oyentesSesionExpirada.forEach((oyente) => oyente(error))
    throw error
  }

  return datos
}

export const apiGet = (ruta, opciones) => peticion(ruta, { ...opciones, metodo: 'GET' })
export const apiPost = (ruta, cuerpo, opciones) => peticion(ruta, { ...opciones, metodo: 'POST', cuerpo })
export const apiPut = (ruta, cuerpo, opciones) => peticion(ruta, { ...opciones, metodo: 'PUT', cuerpo })
export const apiPatch = (ruta, cuerpo, opciones) => peticion(ruta, { ...opciones, metodo: 'PATCH', cuerpo })
export const apiDelete = (ruta, opciones) => peticion(ruta, { ...opciones, metodo: 'DELETE' })

// Arma "?a=1&b=2" ignorando los filtros vacíos, que es el caso habitual
// cuando el usuario no ha tocado un select.
export function conQuery(ruta, parametros = {}) {
  const query = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor === undefined || valor === null || valor === '' || valor === 'todos') continue
    query.set(clave, String(valor))
  }
  const texto = query.toString()
  return texto ? `${ruta}?${texto}` : ruta
}
