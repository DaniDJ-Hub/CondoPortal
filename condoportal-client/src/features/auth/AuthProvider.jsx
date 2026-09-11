// Sprint 1 — Backend 2: manejo de sesión (token/logout).
//
// Recupera el token guardado, lo valida contra /auth/me al arrancar y expone
// entrar / registrarse / salir al resto de la aplicación.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ContextoAuth } from './hooks/useAuth'
import * as api from './api'
import {
  alExpirarSesion,
  borrarSesion,
  guardarSesion,
  leerToken,
  leerUsuarioGuardado,
} from '../../shared/services/apiClient'

export function AuthProvider({ children }) {
  // Partimos del usuario guardado para no parpadear en cada recarga; la
  // validación contra el servidor lo confirma o lo descarta enseguida.
  const [usuario, setUsuario] = useState(() => (leerToken() ? leerUsuarioGuardado() : null))
  const [cargando, setCargando] = useState(() => Boolean(leerToken()))

  const salir = useCallback(async ({ avisarAlServidor = true } = {}) => {
    if (avisarAlServidor && leerToken()) {
      // Si la petición falla igual cerramos: la sesión local debe terminar.
      try {
        await api.logout()
      } catch {
        // Token ya vencido o servidor caído.
      }
    }
    borrarSesion()
    setUsuario(null)
  }, [])

  // Validación inicial del token guardado. Sin token no hay nada que validar y
  // `cargando` ya arrancó en false, así que el efecto no toca estado.
  useEffect(() => {
    if (!leerToken()) return undefined

    let vigente = true
    api
      .sesionActual()
      .then(({ usuario: confirmado }) => {
        if (!vigente) return
        setUsuario(confirmado)
        guardarSesion(leerToken(), confirmado)
      })
      .catch(() => {
        if (vigente) {
          borrarSesion()
          setUsuario(null)
        }
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })

    return () => {
      vigente = false
    }
  }, [])

  // Cualquier 401 de la API cierra la sesión, venga de donde venga.
  useEffect(() => alExpirarSesion(() => salir({ avisarAlServidor: false })), [salir])

  const entrar = useCallback(async (email, password) => {
    const { token, usuario: autenticado } = await api.login(email, password)
    guardarSesion(token, autenticado)
    setUsuario(autenticado)
    return autenticado
  }, [])

  const registrarse = useCallback(async (datos) => {
    const { token, usuario: creado } = await api.registro(datos)
    guardarSesion(token, creado)
    setUsuario(creado)
    return creado
  }, [])

  const valor = useMemo(
    () => ({
      usuario,
      cargando,
      autenticado: Boolean(usuario),
      esAdmin: usuario?.rol === 'admin',
      esProveedor: usuario?.rol === 'proveedor',
      entrar,
      registrarse,
      salir,
    }),
    [usuario, cargando, entrar, registrarse, salir],
  )

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>
}
