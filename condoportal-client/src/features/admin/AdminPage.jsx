// Sprint 5 — Full-Stack/QA: panel de administración general.

import { useCallback, useState } from 'react'
import { useApi } from '../../shared/hooks/useApi'
import { getResumen, getUsuarios } from './api'
import GestionUsuarios from './components/GestionUsuarios'
import FormularioUsuario from './components/FormularioUsuario'
import { Contenido } from '../../shared/components/Estados'
import { fmtMoneda, fmtNumero, fmtPorcentaje } from '../../shared/utils/formato'

// "10 residente" se lee mal en el resumen: cada rol lleva su plural.
const PLURAL_ROL = {
  admin: ['administrador', 'administradores'],
  residente: ['residente', 'residentes'],
  proveedor: ['proveedor', 'proveedores'],
}

const textoRol = ({ rol, cantidad }) =>
  `${cantidad} ${(PLURAL_ROL[rol] ?? [rol, rol])[cantidad === 1 ? 0 : 1]}`

function Dato({ etiqueta, valor, detalle }) {
  return (
    <article className="dato">
      <h3 className="dato__etiqueta">{etiqueta}</h3>
      <p className="dato__valor">{valor}</p>
      {detalle && <p className="dato__detalle">{detalle}</p>}
    </article>
  )
}

function AdminPage() {
  const [formularioAbierto, setFormularioAbierto] = useState(false)

  const resumen = useApi(({ señal }) => getResumen({ señal }), [])
  const usuarios = useApi(({ señal }) => getUsuarios({}, { señal }), [])

  // Al crear o modificar un usuario cambian también las cifras del resumen.
  const refrescar = useCallback(() => {
    usuarios.recargar()
    resumen.recargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- recargar es estable
  }, [])

  const datos = resumen.datos

  return (
    <div className="pagina">
      <header className="pagina__cabecera">
        <div>
          <p className="eyebrow">Gestión del conjunto</p>
          <h1 className="titulo">Panel de administración</h1>
          <p className="sub">Cifras del condominio y control de accesos al portal.</p>
        </div>
      </header>

      <section className="seccion" aria-labelledby="resumen-titulo">
        <header className="seccion__cabecera">
          <h2 id="resumen-titulo" className="seccion__titulo">Resumen general</h2>
        </header>

        <Contenido
          cargando={resumen.cargando}
          error={resumen.error}
          onReintentar={resumen.recargar}
          filasCarga={3}
        >
          {datos && (
            <div className="datos-grid">
              <Dato
                etiqueta="Saldo del fondo"
                valor={fmtMoneda(datos.kpis.saldoActual)}
                detalle={`${fmtMoneda(datos.kpis.totalIngresos)} cobrados · ${fmtMoneda(datos.kpis.totalEgresos)} gastados`}
              />
              <Dato
                etiqueta="Por cobrar"
                valor={fmtMoneda(datos.kpis.porCobrar)}
                detalle={`${fmtNumero(datos.kpis.cuotasVencidas)} ${datos.kpis.cuotasVencidas === 1 ? 'cuota vencida' : 'cuotas vencidas'} · morosidad ${fmtPorcentaje(datos.kpis.tasaMorosidad)}`}
              />
              <Dato
                etiqueta="Usuarios"
                valor={fmtNumero(datos.usuarios.total)}
                detalle={datos.usuarios.porRol.filter((r) => r.cantidad > 0).map(textoRol).join(' · ')}
              />
              <Dato
                etiqueta="Marketplace"
                valor={fmtNumero(datos.marketplace.activos)}
                detalle={`${fmtNumero(datos.marketplace.destacados)} destacados de ${fmtNumero(datos.marketplace.total)} registrados`}
              />
            </div>
          )}
        </Contenido>
      </section>

      <GestionUsuarios
        usuarios={usuarios.datos?.usuarios ?? []}
        cargando={usuarios.cargando}
        error={usuarios.error}
        onReintentar={usuarios.recargar}
        onCambio={refrescar}
        onNuevo={() => setFormularioAbierto(true)}
      />

      {formularioAbierto && (
        <FormularioUsuario
          onCerrar={() => setFormularioAbierto(false)}
          onCreado={() => {
            setFormularioAbierto(false)
            refrescar()
          }}
        />
      )}
    </div>
  )
}

export default AdminPage
