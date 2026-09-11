// Sprint 5 — Full-Stack/QA: "Persistir preferencia de tema".
//
// El tema vive en `document.body` (clase `light` / `dark`) porque tokens.css
// define ahí la paleta del modo claro. Se guarda en localStorage y, si la
// persona nunca ha elegido, se sigue la preferencia del sistema.

import { useCallback, useEffect, useState } from 'react'

const CLAVE = 'condoportal.tema'
const TEMAS = ['light', 'dark']

function leerGuardado() {
  try {
    const guardado = localStorage.getItem(CLAVE)
    return TEMAS.includes(guardado) ? guardado : null
  } catch {
    // Modo privado o almacenamiento bloqueado.
    return null
  }
}

function temaDelSistema() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function aplicar(tema) {
  document.body.classList.toggle('light', tema === 'light')
  document.body.classList.toggle('dark', tema === 'dark')
  document.documentElement.style.colorScheme = tema
}

export function useTheme() {
  const [tema, setTema] = useState(() => leerGuardado() ?? temaDelSistema())
  // Sólo seguimos al sistema mientras la persona no haya elegido a mano.
  const [siguiendoAlSistema, setSiguiendoAlSistema] = useState(() => leerGuardado() === null)

  useEffect(() => {
    aplicar(tema)
  }, [tema])

  useEffect(() => {
    if (!siguiendoAlSistema || !window.matchMedia) return undefined

    const consulta = window.matchMedia('(prefers-color-scheme: dark)')
    const alCambiar = (evento) => setTema(evento.matches ? 'dark' : 'light')
    consulta.addEventListener('change', alCambiar)
    return () => consulta.removeEventListener('change', alCambiar)
  }, [siguiendoAlSistema])

  const cambiarTema = useCallback((nuevo) => {
    const elegido = TEMAS.includes(nuevo) ? nuevo : 'light'
    setTema(elegido)
    setSiguiendoAlSistema(false)
    try {
      localStorage.setItem(CLAVE, elegido)
    } catch {
      // Si no se puede guardar, al menos el cambio aplica en esta sesión.
    }
  }, [])

  const alternarTema = useCallback(() => {
    cambiarTema(tema === 'light' ? 'dark' : 'light')
  }, [tema, cambiarTema])

  return { tema, cambiarTema, alternarTema, siguiendoAlSistema }
}
