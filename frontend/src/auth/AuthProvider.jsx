/*
 * Holds the signed-in account for the whole app.
 * On load it uses the refresh cookie, then loads the profile.
 * Login and logout go through authService.js. Roles use permissions.js.
 */
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

// Provides the account, role, and login actions to the tree under it.
export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  // Drop the in-memory access token and the account together.
  const clearAuth = useCallback(() => {
    clearAccessToken()
    setAccount(null)
  }, [])

  // New access token from the cookie, then the profile. Failure signs us out.
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
        // Stop waiting if refresh hangs, so the app can leave the loading screen.
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

  // Keep the access token and the account returned by a successful login.
  const login = useCallback(async ({ username, password }) => {
    const data = await loginRequest({ username, password })
    setAccessToken(data.access_token)
    setAccount(data.account)
    return data.account
  }, [])

  // logoutRequest clears the cookie and the token. clearAuth drops the account.
  const logout = useCallback(async () => {
    await logoutRequest()
    clearAuth()
  }, [clearAuth])

  // isAuthenticated follows the account. permissions follow account.role.
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
