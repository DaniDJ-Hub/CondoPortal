// Punto de arranque del servidor.

import { config } from './config/env.js'
import { iniciarBaseDeDatos, modoBaseDeDatos, cerrarBaseDeDatos } from './db/index.js'
import { crearApp } from './app.js'

// La base de datos se inicia antes de escuchar, para que ninguna petición
// llegue a un almacén sin inicializar.
await iniciarBaseDeDatos()

const app = crearApp()
const servidor = app.listen(config.puerto, () => {
  console.log(`CondoPortal API en http://localhost:${config.puerto} (datos: ${modoBaseDeDatos()})`)
})

// Cierre ordenado: deja de aceptar conexiones y libera el pool de PostgreSQL.
for (const senal of ['SIGINT', 'SIGTERM']) {
  process.on(senal, () => {
    console.log(`\nRecibido ${senal}, cerrando servidor…`)
    servidor.close(async () => {
      await cerrarBaseDeDatos()
      process.exit(0)
    })
  })
}
