// Presentación de los movimientos del estado de cuenta.
//
// Antes vivía junto a los datos de ejemplo; ahora que el historial se alimenta
// del endpoint real, la configuración visual es lo único que queda aquí.
//
// `signo`: 1 reduce el adeudo (pago), -1 lo aumenta (cargo), 0 neutro.

export const CONFIG_TIPO = {
  pago: { etiqueta: 'Pago', signo: 1, clase: 'mov--ingreso', icono: 'entra' },
  cargo: { etiqueta: 'Cargo', signo: -1, clase: 'mov--egreso', icono: 'sale' },
  otro: { etiqueta: 'Otro', signo: 0, clase: 'mov--otro', icono: 'punto' },
}

export const CONFIG_ESTADO = {
  completado: { etiqueta: 'Completado', clase: 'badge--ok' },
  pagada: { etiqueta: 'Pagada', clase: 'badge--ok' },
  parcial: { etiqueta: 'Abonada', clase: 'badge--warning' },
  pendiente: { etiqueta: 'Pendiente', clase: 'badge--warning' },
  vencida: { etiqueta: 'Vencida', clase: 'badge--danger' },
  rechazado: { etiqueta: 'Rechazado', clase: 'badge--neutral' },
}

export const FILTROS_TIPO = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'pago', etiqueta: 'Pagos' },
  { valor: 'cargo', etiqueta: 'Cargos' },
]

export const FILTROS_ESTADO = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'completado', etiqueta: 'Completado' },
  { valor: 'pagada', etiqueta: 'Pagada' },
  { valor: 'parcial', etiqueta: 'Abonada' },
  { valor: 'pendiente', etiqueta: 'Pendiente' },
  { valor: 'vencida', etiqueta: 'Vencida' },
]
