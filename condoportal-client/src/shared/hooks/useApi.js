// Hook genérico de carga de datos.
//
// Resuelve el trío cargando / error / datos que repiten casi todas las vistas,
// cancela la petición si el componente se desmonta y expone `recargar` para
// los botones de reintento.
//
// `cargando` no es estado propio: se deriva de comparar la petición que pide
// la vista con la que ya está resuelta en memoria. Así el efecto sólo escribe
// estado cuando la respuesta llega, nunca de forma síncrona al montarse.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export function useApi(cargarDatos, dependencias = []) {
  const [intento, setIntento] = useState(0)
  // Identifica de forma estable "qué petición toca": cambia con las
  // dependencias que declara la vista o al pulsar Reintentar.
  const marca = `${JSON.stringify(dependencias)}|${intento}`

  const [resultado, setResultado] = useState({ marca: null, datos: null, error: null })

  // La función de carga suele venir como arrow en línea y cambiaría en cada
  // render; se guarda en una ref para que sólo las dependencias declaradas
  // disparen una nueva petición.
  const cargarRef = useRef(cargarDatos)
  useEffect(() => {
    cargarRef.current = cargarDatos
  })

  useEffect(() => {
    const controlador = new AbortController()

    cargarRef
      .current({ señal: controlador.signal })
      .then((datos) => {
        if (!controlador.signal.aborted) setResultado({ marca, datos, error: null })
      })
      .catch((error) => {
        if (controlador.signal.aborted || error.name === 'AbortError') return
        setResultado({ marca, datos: null, error })
      })

    return () => controlador.abort()
  }, [marca])

  const recargar = useCallback(() => setIntento((n) => n + 1), [])

  // Permite que la vista aplique datos que ya tiene a la mano (por ejemplo el
  // estado de cuenta que devuelve el pago) sin volver a pedirlos.
  const setDatos = useCallback(
    (datos) => setResultado((previo) => ({ ...previo, datos, error: null })),
    [],
  )

  return useMemo(
    () => ({
      datos: resultado.datos,
      error: resultado.error,
      cargando: resultado.marca !== marca,
      recargar,
      setDatos,
    }),
    [resultado, marca, recargar, setDatos],
  )
}
