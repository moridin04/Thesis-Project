import { useCallback, useEffect, useMemo, useState } from 'react'
import { clearAccessToken, setAccessToken } from './tokenStore'
import { AuthContext } from './AuthContext'
import { permissionsForRole } from '../config/permissions'
import {
  fetchCurrentAccount,
  loginRequest,
  logoutRequest,
  refreshSessionRequest,
} from '../services/authService'

export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearAuth = useCallback(() => {
    clearAccessToken()
    setAccount(null)
  }, [])

  const restoreSession = useCallback(async () => {
    try {
      const tokenData = await refreshSessionRequest()
      setAccessToken(tokenData.access_token)
      const profile = await fetchCurrentAccount()
      setAccount(profile)
      return profile
    } catch {
      clearAuth()
      return null
    }
  }, [clearAuth])

  useEffect(() => {
    let active = true

    async function bootstrap() {
      try {
        await Promise.race([
          restoreSession(),
          new Promise((_, reject) => {
            window.setTimeout(() => reject(new Error('Session restore timed out')), 8000)
          }),
        ])
      } catch {
        clearAuth()
      } finally {
        if (active) setLoading(false)
      }
    }

    bootstrap()
    return () => {
      active = false
    }
  }, [restoreSession, clearAuth])

  const login = useCallback(async ({ username, password }) => {
    const data = await loginRequest({ username, password })
    setAccessToken(data.access_token)
    setAccount(data.account)
    return data.account
  }, [])

  const logout = useCallback(async () => {
    await logoutRequest()
    clearAuth()
  }, [clearAuth])

  const value = useMemo(
    () => ({
      account,
      currentAccount: account,
      loading,
      isAuthenticated: Boolean(account),
      role: account?.role ?? null,
      permissions: permissionsForRole(account?.role),
      login,
      restoreSession,
      logout,
    }),
    [account, loading, login, restoreSession, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
