// Sprint 2 — Frontend 2: tabla del Historial de Movimientos.
// Marcado semántico único; la vista de tarjetas <768px se resuelve en CSS.

import FilaMovimiento from './FilaMovimiento'

function TablaMovimientos({ movimientos }) {
  return (
    <table className="table table--historial">
      <caption className="sr-only">
        Historial de movimientos de la cuenta, del más reciente al más antiguo.
      </caption>
      <thead>
        <tr>
          <th scope="col">Fecha</th>
          <th scope="col">Concepto</th>
          <th scope="col">Tipo</th>
          <th scope="col" className="mov__monto">Monto</th>
          <th scope="col">Estado</th>
          <th scope="col" className="mov__saldo">Saldo</th>
        </tr>
      </thead>
      <tbody>
        {movimientos.map((mov) => (
          <FilaMovimiento key={mov.id} mov={mov} />
        ))}
      </tbody>
    </table>
  )
}

export default TablaMovimientos
