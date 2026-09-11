// Sprint 2 — Frontend 2: carga del Historial de Movimientos.
//
// Conectado al endpoint real `/pagos/movimientos`, que devuelve los cargos de
// cada cuota y los pagos aplicados con el saldo corrido de la cuenta.

import { useCallback } from 'react'
import { useApi } from '../../../shared/hooks/useApi'
import { getMovimientos } from '../api'

export function useHistorialMovimientos(usuarioId) {
  const cargar = useCallback(({ señal }) => getMovimientos(usuarioId, { señal }), [usuarioId])
  const { datos, cargando, error, recargar } = useApi(cargar, [usuarioId])

  return {
    movimientos: datos?.movimientos ?? [],
    saldoActual: datos?.saldoActual ?? 0,
    cargando,
    error,
    recargar,
  }
}
