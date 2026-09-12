// Navegación en píldoras — diseño de Frontend 1, adaptado a CondoPortal.
//
// Cambios respecto al original:
// - Los colores salen de los tokens (--pill-*), no de props, para que el
//   componente siga al tema claro/oscuro sin que nadie le pase nada.
// - Siempre navega con el router, y es NavLink quien decide qué píldora está
//   activa: el original comparaba la ruta a mano y con eso /marketplace/:id
//   dejaba la barra sin ninguna sección marcada.
// - Sin logo: la marca ya vive en Layout y duplicarla descuadraba la barra.
// - Quien pidió menos movimiento recibe la barra estática, sin gsap.

import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { gsap } from 'gsap'

const EASE = 'power3.easeOut'

function prefiereMenosMovimiento() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

function PillNav({ items = [], onNavegar }) {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const circulosRef = useRef([])
  const lineasRef = useRef([])
  const tweensRef = useRef([])
  const hamburguesaRef = useRef(null)
  const menuRef = useRef(null)

  // Cada píldora esconde un círculo que crece desde abajo al pasar el ratón,
  // mientras la etiqueta sube y una copia entra en su lugar. El radio se
  // calcula a partir del tamaño real de la píldora, así que hay que rehacerlo
  // en cada resize y cuando terminan de cargar las fuentes.
  useEffect(() => {
    if (prefiereMenosMovimiento()) return undefined

    const medir = () => {
      circulosRef.current.forEach((circulo, indice) => {
        if (!circulo?.parentElement) return

        const pildora = circulo.parentElement
        const { width, height } = pildora.getBoundingClientRect()
        if (!width || !height) return

        const radio = ((width * width) / 4 + height * height) / (2 * height)
        const diametro = Math.ceil(2 * radio) + 2
        const delta =
          Math.ceil(radio - Math.sqrt(Math.max(0, radio * radio - (width * width) / 4))) + 1

        const etiqueta = pildora.querySelector('.pill-label')
        const etiquetaHover = pildora.querySelector('.pill-label-hover')

        circulo.style.width = `${diametro}px`
        circulo.style.height = `${diametro}px`
        circulo.style.bottom = `-${delta}px`

        gsap.set(circulo, { xPercent: -50, scale: 0, transformOrigin: `50% ${diametro - delta}px` })
        if (etiqueta) gsap.set(etiqueta, { y: 0 })
        if (etiquetaHover) gsap.set(etiquetaHover, { y: height + 12, opacity: 0 })

        lineasRef.current[indice]?.kill()
        const linea = gsap.timeline({ paused: true })
        linea.to(circulo, { scale: 1.2, duration: 2, ease: EASE }, 0)
        if (etiqueta) linea.to(etiqueta, { y: -(height + 8), duration: 2, ease: EASE }, 0)
        if (etiquetaHover) linea.to(etiquetaHover, { y: 0, opacity: 1, duration: 2, ease: EASE }, 0)
        lineasRef.current[indice] = linea
      })
    }

    medir()
    window.addEventListener('resize', medir)
    document.fonts?.ready.then(medir).catch(() => {})

    if (menuRef.current) gsap.set(menuRef.current, { visibility: 'hidden', opacity: 0 })

    const lineas = lineasRef.current
    const tweens = tweensRef.current
    return () => {
      window.removeEventListener('resize', medir)
      lineas.forEach((linea) => linea?.kill())
      tweens.forEach((tween) => tween?.kill())
    }
  }, [items])

  function animarHacia(indice, destino, duracion) {
    const linea = lineasRef.current[indice]
    if (!linea) return
    tweensRef.current[indice]?.kill()
    tweensRef.current[indice] = linea.tweenTo(destino, { duration: duracion, ease: EASE })
  }

  function alternarMenu() {
    const abierto = !menuAbierto
    setMenuAbierto(abierto)

    const menu = menuRef.current
    const lineas = hamburguesaRef.current?.querySelectorAll('.hamburger-line')

    if (prefiereMenosMovimiento()) {
      if (menu) menu.style.visibility = abierto ? 'visible' : 'hidden'
      if (menu) menu.style.opacity = abierto ? '1' : '0'
      return
    }

    if (lineas?.length === 2) {
      gsap.to(lineas[0], { rotation: abierto ? 45 : 0, y: abierto ? 3 : 0, duration: 0.3, ease: EASE })
      gsap.to(lineas[1], { rotation: abierto ? -45 : 0, y: abierto ? -3 : 0, duration: 0.3, ease: EASE })
    }

    if (menu) {
      gsap.to(menu, {
        autoAlpha: abierto ? 1 : 0,
        y: abierto ? 0 : 10,
        duration: 0.3,
        ease: EASE,
        onStart: () => abierto && gsap.set(menu, { visibility: 'visible' }),
        onComplete: () => !abierto && gsap.set(menu, { visibility: 'hidden' }),
      })
    }
  }

  function cerrarYNavegar() {
    setMenuAbierto(false)
    onNavegar?.()
  }

  function enlace(item, indice, movil = false) {
    if (movil) {
      return (
        <NavLink
          to={item.href}
          className={({ isActive }) => `mobile-menu-link${isActive ? ' is-active' : ''}`}
          onClick={cerrarYNavegar}
        >
          {item.label}
        </NavLink>
      )
    }

    return (
      <NavLink
        to={item.href}
        className={({ isActive }) => `pill${isActive ? ' is-active' : ''}`}
        onClick={cerrarYNavegar}
        onMouseEnter={() => animarHacia(indice, lineasRef.current[indice]?.duration() ?? 0, 0.3)}
        onMouseLeave={() => animarHacia(indice, 0, 0.2)}
      >
        <span
          className="hover-circle"
          aria-hidden="true"
          ref={(elemento) => {
            circulosRef.current[indice] = elemento
          }}
        />
        <span className="label-stack">
          <span className="pill-label">{item.label}</span>
          <span className="pill-label-hover" aria-hidden="true">{item.label}</span>
        </span>
      </NavLink>
    )
  }

  return (
    <div className="pill-nav-container">
      <nav className="pill-nav" aria-label="Navegación principal">
        <div className="pill-nav-items desktop-only">
          <ul className="pill-list">
            {items.map((item, indice) => (
              <li key={item.href}>{enlace(item, indice)}</li>
            ))}
          </ul>
        </div>

        <button
          className="mobile-menu-button mobile-only"
          type="button"
          onClick={alternarMenu}
          aria-label="Abrir menú de navegación"
          aria-expanded={menuAbierto}
          aria-controls="pill-nav-menu"
          ref={hamburguesaRef}
        >
          <span className="hamburger-line" />
          <span className="hamburger-line" />
        </button>
      </nav>

      <div className="mobile-menu-popover mobile-only" id="pill-nav-menu" ref={menuRef}>
        <ul className="mobile-menu-list">
          {items.map((item, indice) => (
            <li key={item.href}>{enlace(item, indice, true)}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default PillNav
