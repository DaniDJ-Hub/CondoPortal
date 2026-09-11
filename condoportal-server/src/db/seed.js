// Datos semilla de CondoPortal.
//
// Son la misma fuente de verdad para los dos modos de persistencia: el
// almacén en memoria los carga tal cual al arrancar y `npm run db:seed` los
// inserta en PostgreSQL. Así el equipo ve exactamente los mismos números
// trabaje con o sin base de datos.
//
// Las fechas se calculan relativas al día de hoy en vez de estar fijas: de
// otro modo la demo envejece y, con el tiempo, todas las cuotas aparecerían
// vencidas y el dashboard se quedaría sin meses recientes que graficar.

import bcrypt from 'bcryptjs'

// Contraseña de prueba para todas las cuentas demo: "123456"
export const PASSWORD_DEMO = '123456'
const hashDemo = bcrypt.hashSync(PASSWORD_DEMO, 10)

const HOY = new Date()
const ANIO = HOY.getUTCFullYear()
const MES = HOY.getUTCMonth()
const DIA = HOY.getUTCDate()

const dosDigitos = (n) => String(n).padStart(2, '0')

// Clave de periodo 'AAAA-MM' de hace `atras` meses.
export function periodo(atras) {
  const fecha = new Date(Date.UTC(ANIO, MES - atras, 1))
  return `${fecha.getUTCFullYear()}-${dosDigitos(fecha.getUTCMonth() + 1)}`
}

// Día concreto de ese mes. En el mes en curso nunca devolvemos una fecha
// futura, para que los movimientos "ya ocurridos" sigan siéndolo.
function fecha(atras, dia) {
  const base = new Date(Date.UTC(ANIO, MES - atras, 1))
  const ultimoDia = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)).getUTCDate()
  const elegido = Math.min(dia, ultimoDia, atras === 0 ? DIA : ultimoDia)
  return `${base.getUTCFullYear()}-${dosDigitos(base.getUTCMonth() + 1)}-${dosDigitos(elegido)}`
}

// Último día del mes: lo usamos para la cuota en curso, que todavía no vence.
function finDeMes(atras) {
  const base = new Date(Date.UTC(ANIO, MES - atras + 1, 0))
  return `${base.getUTCFullYear()}-${dosDigitos(base.getUTCMonth() + 1)}-${dosDigitos(base.getUTCDate())}`
}

const instante = (atras, dia, hora = 12) => new Date(`${fecha(atras, dia)}T${dosDigitos(hora)}:00:00.000Z`).toISOString()

const mesDe = (fechaISO) => {
  const [anio, mesTexto] = fechaISO.split('-')
  const nombres = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  return `${nombres[Number(mesTexto) - 1]} ${anio}`
}

const cuotaMensual = (id, usuarioId, atras, estatus) => ({
  id,
  usuarioId,
  periodo: periodo(atras),
  concepto: `Cuota de mantenimiento · ${mesDe(periodo(atras))}`,
  monto: 1200,
  // La del mes en curso vence al cierre del mes; las anteriores, el día 10.
  venceEn: atras === 0 ? finDeMes(0) : fecha(atras, 10),
  estatus,
})

// Padrón del condominio. El comportamiento de pago de cada unidad genera
// después sus cuotas y sus abonos, de modo que la demo tenga residentes al
// corriente, uno que paga tarde y dos morosos, sin escribir a mano decenas
// de filas que se desincronizarían entre sí.
const CUOTA_MENSUAL = 1800
// Se factura toda la ventana que grafica el dashboard, para que los
// ingresos y los egresos del periodo sean comparables.
const MESES_FACTURADOS = [5, 4, 3, 2, 1, 0]

const RESIDENTES = [
  { id: 2, nombre: 'Residente Demo', email: 'residente@condoportal.com', unidad: 'A-101', comportamiento: 'puntual' },
  { id: 3, nombre: 'Mariana Ortega', email: 'mariana@condoportal.com', unidad: 'A-204', comportamiento: 'puntual' },
  { id: 4, nombre: 'Rubén Salinas', email: 'ruben@condoportal.com', unidad: 'B-302', comportamiento: 'moroso' },
  { id: 6, nombre: 'Lucía Fernández', email: 'lucia@condoportal.com', unidad: 'A-103', comportamiento: 'puntual' },
  { id: 7, nombre: 'Diego Cantú', email: 'diego@condoportal.com', unidad: 'A-205', comportamiento: 'anticipado' },
  { id: 8, nombre: 'Paola Treviño', email: 'paola@condoportal.com', unidad: 'B-101', comportamiento: 'tardio' },
  { id: 9, nombre: 'Andrés Villarreal', email: 'andres@condoportal.com', unidad: 'B-204', comportamiento: 'anticipado' },
  { id: 10, nombre: 'Sofía Garza', email: 'sofia@condoportal.com', unidad: 'C-102', comportamiento: 'anticipado' },
  { id: 11, nombre: 'Héctor Maldonado', email: 'hector@condoportal.com', unidad: 'C-301', comportamiento: 'moroso' },
  { id: 12, nombre: 'Regina Solís', email: 'regina@condoportal.com', unidad: 'C-305', comportamiento: 'anticipado' },
]

export const USUARIOS = [
  { id: 1, nombre: 'Admin Demo', email: 'admin@condoportal.com', passwordHash: hashDemo, rol: 'admin', unidad: 'ADM', telefono: '81-1000-0001', activo: true, creadoEn: instante(8, 15, 9) },
  ...RESIDENTES.map((residente, i) => ({
    id: residente.id,
    nombre: residente.nombre,
    email: residente.email,
    passwordHash: hashDemo,
    rol: 'residente',
    unidad: residente.unidad,
    telefono: `81-1000-${String(1000 + residente.id).slice(-4)}`,
    activo: true,
    creadoEn: instante(7 - (i % 5), 3 + i * 2, 10),
  })),
  { id: 5, nombre: 'Servicios Vega', email: 'contacto@serviciosvega.mx', passwordHash: hashDemo, rol: 'proveedor', unidad: null, telefono: '81-1000-0005', activo: true, creadoEn: instante(4, 2, 8) },
].sort((a, b) => a.id - b.id)

// Gastos de los últimos seis meses: los recurrentes (luz y vigilancia) dan
// una línea base estable y los extraordinarios generan los picos del gráfico.
export const GASTOS = [
  { id: 1, descripcion: 'Mantenimiento de jardines', categoria: 'mantenimiento', monto: 3500, fecha: fecha(5, 4), proveedor: 'Jardinería del Valle', creadoPor: 1 },
  { id: 2, descripcion: 'Luz de áreas comunes', categoria: 'servicios', monto: 4120, fecha: fecha(5, 8), proveedor: 'CFE', creadoPor: 1 },
  { id: 3, descripcion: 'Vigilancia nocturna', categoria: 'seguridad', monto: 9800, fecha: fecha(5, 15), proveedor: 'Grupo Alerta', creadoPor: 1 },
  { id: 4, descripcion: 'Limpieza de cisterna', categoria: 'mantenimiento', monto: 2800, fecha: fecha(4, 6), proveedor: 'AquaClean', creadoPor: 1 },
  { id: 5, descripcion: 'Luz de áreas comunes', categoria: 'servicios', monto: 4380, fecha: fecha(4, 8), proveedor: 'CFE', creadoPor: 1 },
  { id: 6, descripcion: 'Vigilancia nocturna', categoria: 'seguridad', monto: 9800, fecha: fecha(4, 15), proveedor: 'Grupo Alerta', creadoPor: 1 },
  { id: 7, descripcion: 'Reparación de portón eléctrico', categoria: 'mantenimiento', monto: 6750, fecha: fecha(3, 2), proveedor: 'Servicios Vega', creadoPor: 1 },
  { id: 8, descripcion: 'Luz de áreas comunes', categoria: 'servicios', monto: 4510, fecha: fecha(3, 8), proveedor: 'CFE', creadoPor: 1 },
  { id: 9, descripcion: 'Vigilancia nocturna', categoria: 'seguridad', monto: 9800, fecha: fecha(3, 15), proveedor: 'Grupo Alerta', creadoPor: 1 },
  { id: 10, descripcion: 'Mantenimiento de alberca', categoria: 'mantenimiento', monto: 3200, fecha: fecha(2, 5), proveedor: 'AquaClean', creadoPor: 1 },
  { id: 11, descripcion: 'Luz de áreas comunes', categoria: 'servicios', monto: 4690, fecha: fecha(2, 8), proveedor: 'CFE', creadoPor: 1 },
  { id: 12, descripcion: 'Vigilancia nocturna', categoria: 'seguridad', monto: 9800, fecha: fecha(2, 15), proveedor: 'Grupo Alerta', creadoPor: 1 },
  { id: 13, descripcion: 'Seguro de responsabilidad civil', categoria: 'administracion', monto: 4900, fecha: fecha(2, 22), proveedor: 'Seguros Monterrey', creadoPor: 1 },
  { id: 14, descripcion: 'Pintura de fachada norte', categoria: 'mantenimiento', monto: 12400, fecha: fecha(1, 3), proveedor: 'Servicios Vega', creadoPor: 1 },
  { id: 15, descripcion: 'Luz de áreas comunes', categoria: 'servicios', monto: 4260, fecha: fecha(1, 8), proveedor: 'CFE', creadoPor: 1 },
  { id: 16, descripcion: 'Vigilancia nocturna', categoria: 'seguridad', monto: 9800, fecha: fecha(1, 15), proveedor: 'Grupo Alerta', creadoPor: 1 },
  { id: 17, descripcion: 'Honorarios de administración', categoria: 'administracion', monto: 4500, fecha: fecha(1, 28), proveedor: 'Teteocan', creadoPor: 1 },
  { id: 18, descripcion: 'Luz de áreas comunes', categoria: 'servicios', monto: 4340, fecha: fecha(0, 8), proveedor: 'CFE', creadoPor: 1 },
]

/* ── Cuotas y pagos generados a partir del comportamiento de cada unidad ── */

// Qué meses deja sin cubrir cada perfil, contados desde el mes en curso.
// Quien tiene domiciliación ('anticipado') ya cubrió incluso la cuota del mes
// en curso, que todavía no vence; el resto la trae pendiente.
const MESES_SIN_PAGAR = {
  anticipado: [],
  puntual: [0],
  tardio: [0, 1],
  moroso: [0, 1, 2],
}

// El moroso deja un abono parcial en su cuota más vieja sin cubrir, para que
// el estatus "parcial" aparezca en la demo sin inventarle un pago completo.
const ABONO_PARCIAL = 600

const cuotas = []
const pagos = []
let idCuota = 1
let idPago = 1

for (const residente of RESIDENTES) {
  const sinPagar = MESES_SIN_PAGAR[residente.comportamiento]

  for (const atras of MESES_FACTURADOS) {
    const cuota = {
      id: idCuota++,
      usuarioId: residente.id,
      periodo: periodo(atras),
      concepto: `Cuota de mantenimiento · ${mesDe(periodo(atras))}`,
      monto: CUOTA_MENSUAL,
      // La del mes en curso vence al cierre del mes; las anteriores, el día 10.
      venceEn: atras === 0 ? finDeMes(0) : fecha(atras, 10),
      estatus: 'pendiente',
    }

    if (!sinPagar.includes(atras)) {
      // Los puntuales pagan en los primeros días; los tardíos, ya vencida.
      const diaPago = residente.comportamiento === 'tardio' ? 18 : 3 + (residente.id % 5)
      cuota.estatus = 'pagada'
      pagos.push({
        id: idPago++,
        usuarioId: residente.id,
        cuotaId: cuota.id,
        monto: CUOTA_MENSUAL,
        concepto: cuota.concepto,
        metodo: ['transferencia', 'domiciliacion', 'tarjeta', 'efectivo'][residente.id % 4],
        referencia: `REF-${String(idPago).padStart(4, '0')}`,
        estatus: 'aplicado',
        fecha: instante(atras, diaPago, 10 + (residente.id % 8)),
      })
    } else if (atras > 0) {
      cuota.estatus = 'vencida'

      const esLaMasVieja = atras === Math.max(...sinPagar)
      if (residente.comportamiento === 'moroso' && esLaMasVieja) {
        cuota.estatus = 'parcial'
        pagos.push({
          id: idPago++,
          usuarioId: residente.id,
          cuotaId: cuota.id,
          monto: ABONO_PARCIAL,
          concepto: `Abono parcial · ${cuota.concepto}`,
          metodo: 'efectivo',
          referencia: `REF-${String(idPago).padStart(4, '0')}`,
          estatus: 'aplicado',
          fecha: instante(atras - 1, 19, 16),
        })
      }
    }

    cuotas.push(cuota)
  }
}

export const CUOTAS = cuotas
export const PAGOS = pagos.sort((a, b) => a.fecha.localeCompare(b.fecha))

export const NEGOCIOS = [
  { id: 1, proveedorId: 5, nombre: 'Servicios Vega', categoria: 'mantenimiento', descripcion: 'Plomería, electricidad y herrería con atención el mismo día dentro del condominio.', telefono: '81-1000-0005', email: 'contacto@serviciosvega.mx', sitioWeb: 'https://serviciosvega.mx', horario: 'Lun a Sáb · 8:00 a 19:00', emblema: '🔧', destacado: true, activo: true, creadoEn: instante(4, 2, 8) },
  { id: 2, proveedorId: null, nombre: 'Panadería La Espiga', categoria: 'alimentos', descripcion: 'Pan artesanal horneado a diario y pedidos especiales para eventos del salón social.', telefono: '81-2000-0010', email: 'hola@laespiga.mx', sitioWeb: '', horario: 'Todos los días · 7:00 a 21:00', emblema: '🥖', destacado: true, activo: true, creadoEn: instante(4, 10, 9) },
  { id: 3, proveedorId: null, nombre: 'Lavandería Aqua', categoria: 'hogar', descripcion: 'Lavado, planchado y tintorería con recolección y entrega en la caseta.', telefono: '81-2000-0011', email: 'pedidos@aqualavanderia.mx', sitioWeb: '', horario: 'Lun a Sáb · 9:00 a 20:00', emblema: '🧺', destacado: false, activo: true, creadoEn: instante(4, 18, 15) },
  { id: 4, proveedorId: null, nombre: 'Clases de Natación Delfín', categoria: 'deporte', descripcion: 'Clases grupales e individuales en la alberca del condominio para todas las edades.', telefono: '81-2000-0012', email: 'delfin@deporte.mx', sitioWeb: '', horario: 'Mar a Dom · 7:00 a 12:00', emblema: '🏊', destacado: false, activo: true, creadoEn: instante(3, 5, 11) },
  { id: 5, proveedorId: null, nombre: 'Veterinaria Patitas', categoria: 'mascotas', descripcion: 'Consulta, vacunación y estética canina a domicilio dentro del fraccionamiento.', telefono: '81-2000-0013', email: 'citas@patitas.mx', sitioWeb: 'https://patitas.mx', horario: 'Lun a Vie · 10:00 a 18:00', emblema: '🐾', destacado: true, activo: true, creadoEn: instante(3, 21, 13) },
  { id: 6, proveedorId: null, nombre: 'Café de Barrio', categoria: 'alimentos', descripcion: 'Café de especialidad, repostería y espacio de coworking a dos cuadras del acceso principal.', telefono: '81-2000-0014', email: 'hola@cafedebarrio.mx', sitioWeb: '', horario: 'Lun a Dom · 7:30 a 22:00', emblema: '☕', destacado: false, activo: true, creadoEn: instante(2, 14, 8) },
  { id: 7, proveedorId: null, nombre: 'Regularización Ábaco', categoria: 'educacion', descripcion: 'Asesoría de matemáticas y ciencias para secundaria y preparatoria en el salón de usos múltiples.', telefono: '81-2000-0015', email: 'abaco@educacion.mx', sitioWeb: '', horario: 'Lun a Jue · 16:00 a 20:00', emblema: '📐', destacado: false, activo: true, creadoEn: instante(2, 1, 17) },
  { id: 8, proveedorId: null, nombre: 'Jardinería del Valle', categoria: 'mantenimiento', descripcion: 'Diseño y mantenimiento de jardines privados, poda y sistemas de riego.', telefono: '81-2000-0016', email: 'valle@jardineria.mx', sitioWeb: '', horario: 'Lun a Sáb · 7:00 a 17:00', emblema: '🌿', destacado: false, activo: true, creadoEn: instante(1, 19, 10) },
]

export const RESENAS = [
  { id: 1, negocioId: 1, usuarioId: 2, calificacion: 5, comentario: 'Llegaron el mismo día por una fuga y lo dejaron impecable.', fecha: instante(3, 12, 19) },
  { id: 2, negocioId: 1, usuarioId: 3, calificacion: 4, comentario: 'Buen trabajo en el portón, aunque tardaron en cotizar.', fecha: instante(2, 2, 10) },
  { id: 3, negocioId: 2, usuarioId: 3, calificacion: 5, comentario: 'El pan de masa madre de los sábados vuela.', fecha: instante(2, 25, 8) },
  { id: 4, negocioId: 2, usuarioId: 4, calificacion: 5, comentario: 'Nos surtieron el bocadillo para la asamblea, muy puntuales.', fecha: instante(1, 9, 12) },
  { id: 5, negocioId: 3, usuarioId: 2, calificacion: 4, comentario: 'Práctico que recojan en caseta. Entrega en 48 horas.', fecha: instante(1, 14, 17) },
  { id: 6, negocioId: 5, usuarioId: 4, calificacion: 5, comentario: 'La veterinaria es muy paciente con los perros nerviosos.', fecha: instante(1, 22, 14) },
  { id: 7, negocioId: 4, usuarioId: 3, calificacion: 4, comentario: 'Grupos pequeños y buen trato con los niños.', fecha: instante(0, 2, 9) },
]

// Coordenadas en porcentaje (0-100) sobre el plano del condominio, para que
// el mapa interactivo funcione a cualquier tamaño sin imágenes externas.
export const PUNTOS_INTERES = [
  { id: 1, nombre: 'Caseta de acceso', categoria: 'condominio', emblema: '🛎️', descripcion: 'Control de visitas y paquetería 24/7.', distanciaM: 0, x: 50, y: 92 },
  { id: 2, nombre: 'Alberca y asoleadero', categoria: 'amenidad', emblema: '🏊', descripcion: 'Abierta de 8:00 a 21:00. Aforo de 30 personas.', distanciaM: 120, x: 28, y: 40 },
  { id: 3, nombre: 'Salón de usos múltiples', categoria: 'amenidad', emblema: '🎉', descripcion: 'Reservable desde el portal con 72 horas de anticipación.', distanciaM: 90, x: 68, y: 46 },
  { id: 4, nombre: 'Gimnasio', categoria: 'amenidad', emblema: '🏋️', descripcion: 'Equipado con cardio y peso libre. Acceso con credencial.', distanciaM: 110, x: 74, y: 66 },
  { id: 5, nombre: 'Área canina', categoria: 'amenidad', emblema: '🐾', descripcion: 'Zona cercada con bebederos y bolsas sanitarias.', distanciaM: 150, x: 18, y: 68 },
  { id: 6, nombre: 'Juegos infantiles', categoria: 'amenidad', emblema: '🛝', descripcion: 'Superficie amortiguante y sombra natural.', distanciaM: 130, x: 44, y: 24 },
  { id: 7, nombre: 'Supermercado', categoria: 'comercio', emblema: '🛒', descripcion: 'Abierto de 7:00 a 23:00, con farmacia interna.', distanciaM: 450, x: 88, y: 16 },
  { id: 8, nombre: 'Farmacia San Pablo', categoria: 'salud', emblema: '💊', descripcion: 'Servicio 24 horas y consultorio médico adjunto.', distanciaM: 380, x: 12, y: 14 },
  { id: 9, nombre: 'Parque Lineal Santa Lucía', categoria: 'recreacion', emblema: '🌳', descripcion: 'Ciclovía y pista para correr de 2.4 km.', distanciaM: 600, x: 6, y: 50 },
  { id: 10, nombre: 'Escuela Primaria Juárez', categoria: 'educacion', emblema: '🎓', descripcion: 'Turno matutino y vespertino a 7 minutos caminando.', distanciaM: 520, x: 92, y: 82 },
]

export const SEED = {
  usuarios: USUARIOS,
  gastos: GASTOS,
  cuotas: CUOTAS,
  pagos: PAGOS,
  negocios: NEGOCIOS,
  resenas: RESENAS,
  puntosInteres: PUNTOS_INTERES,
}
