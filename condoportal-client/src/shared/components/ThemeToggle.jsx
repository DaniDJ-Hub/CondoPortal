// Sprint 5 — Frontend 2: toggle de tema claro/oscuro.

import { useTheme } from '../hooks/useTheme'

function ThemeToggle({ compacto = false }) {
  const { tema, alternarTema } = useTheme()
  const esOscuro = tema === 'dark'
  const etiqueta = esOscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'

  return (
    <button
      type="button"
      className={`tema-toggle${compacto ? ' tema-toggle--compacto' : ''}`}
      onClick={alternarTema}
      title={etiqueta}
      aria-label={etiqueta}
      // Se anuncia como interruptor para que un lector de pantalla diga en
      // qué estado quedó, no sólo que hay un botón.
      role="switch"
      aria-checked={esOscuro}
    >
      <span className="tema-toggle__pista" aria-hidden="true">
        <span className="tema-toggle__perilla">
          {esOscuro ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.7 6.7 0 0 0 10.5 10.5Z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          )}
        </span>
      </span>
      {!compacto && <span className="tema-toggle__texto">{esOscuro ? 'Oscuro' : 'Claro'}</span>}
    </button>
  )
}

export default ThemeToggle
