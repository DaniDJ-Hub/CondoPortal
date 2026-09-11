// Almacén en memoria: implementación de respaldo de la interfaz `Tabla`.
//
// Se usa cuando no hay DATABASE_URL configurada, para que el equipo pueda
// levantar el backend sin instalar PostgreSQL. Los datos viven en el proceso
// y se reinician con el servidor.

import { SEED } from './seed.js'

// Clonamos la semilla en cada arranque para que las mutaciones de una
// ejecución (o de una prueba) no contaminen el módulo de datos.
function clonar(filas) {
  return filas.map((fila) => ({ ...fila }))
}

class TablaMemoria {
  constructor(nombre, filas) {
    this.nombre = nombre
    this.filas = clonar(filas)
    this.siguienteId = this.filas.reduce((max, f) => Math.max(max, f.id ?? 0), 0) + 1
  }

  #coincide(fila, filtro) {
    return Object.entries(filtro).every(([campo, valor]) => {
      if (valor === undefined) return true
      if (Array.isArray(valor)) return valor.includes(fila[campo])
      return fila[campo] === valor
    })
  }

  async todos(filtro = {}, { orden, direccion = 'asc' } = {}) {
    const resultado = this.filas.filter((fila) => this.#coincide(fila, filtro)).map((f) => ({ ...f }))
    if (orden) {
      const signo = direccion === 'desc' ? -1 : 1
      resultado.sort((a, b) => {
        if (a[orden] === b[orden]) return 0
        if (a[orden] == null) return 1
        if (b[orden] == null) return -1
        return a[orden] > b[orden] ? signo : -signo
      })
    }
    return resultado
  }

  async uno(filtro) {
    const fila = this.filas.find((f) => this.#coincide(f, filtro))
    return fila ? { ...fila } : null
  }

  async porId(id) {
    return this.uno({ id: Number(id) })
  }

  async insertar(datos) {
    const fila = { id: this.siguienteId++, ...datos }
    this.filas.push(fila)
    return { ...fila }
  }

  async actualizar(id, cambios) {
    const fila = this.filas.find((f) => f.id === Number(id))
    if (!fila) return null
    for (const [campo, valor] of Object.entries(cambios)) {
      if (valor !== undefined) fila[campo] = valor
    }
    return { ...fila }
  }

  async eliminar(id) {
    const indice = this.filas.findIndex((f) => f.id === Number(id))
    if (indice === -1) return false
    this.filas.splice(indice, 1)
    return true
  }
}

export function crearAlmacenMemoria() {
  const tablas = {
    usuarios: new TablaMemoria('usuarios', SEED.usuarios),
    gastos: new TablaMemoria('gastos', SEED.gastos),
    cuotas: new TablaMemoria('cuotas', SEED.cuotas),
    pagos: new TablaMemoria('pagos', SEED.pagos),
    negocios: new TablaMemoria('negocios', SEED.negocios),
    resenas: new TablaMemoria('resenas', SEED.resenas),
    puntosInteres: new TablaMemoria('puntos_interes', SEED.puntosInteres),
  }

  return {
    modo: 'memoria',
    tablas,
    async verificar() {
      return true
    },
    async cerrar() {},
  }
}
