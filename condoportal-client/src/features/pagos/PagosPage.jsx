// Sprint 2 — módulo de pagos: estado de cuenta e historial de movimientos.
//
// La página es la dueña de los datos para que, al registrar un pago, las dos
// vistas se refresquen con la misma información.

import { useCallback } from 'react'
import { useApi } from '../../shared/hooks/useApi'
import { getEstadoCuenta } from './api'
import { useHistorialMovimientos } from './hooks/useHistorialMovimientos'
import EstadoCuenta from './components/EstadoCuenta'
import HistorialMovimientos from './components/HistorialMovimientos'

function PagosPage() {
  const cargarEstado = useCallback(({ señal }) => getEstadoCuenta(null, { señal }), [])
  const { datos: estado, cargando, error, recargar, setDatos } = useApi(cargarEstado, [])
  const historial = useHistorialMovimientos()

  function alPagar(respuesta) {
    // El endpoint de pago ya devuelve el estado de cuenta recalculado, así que
    // lo aplicamos directo y sólo el historial necesita releerse.
    setDatos(respuesta.estadoCuenta)
    historial.recargar()
  }

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <h1 className="titulo">Pagos</h1>
          <p className="sub">Revisa tu saldo, paga tus cuotas y consulta tus movimientos.</p>
        </div>
      </header>

      <EstadoCuenta
        estado={estado}
        cargando={cargando}
        error={error}
        onReintentar={recargar}
        onPagado={alPagar}
      />

      {/* `.historial` ya trae su propia isla: envolverlo en un panel
          dibujaría un recuadro dentro de otro. */}
      <HistorialMovimientos
        movimientos={historial.movimientos}
        cargando={historial.cargando}
        error={historial.error}
        onReintentar={historial.recargar}
      />
    </div>
  )
}

export default PagosPage
