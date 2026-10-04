/*
 * Login, refresh, logout, and the current account.
 * AuthProvider.jsx calls these through the shared client in api.js.
 * The access token stays in tokenStore.js, not in localStorage.
 */
import api from './api'
import { clearAccessToken, setAccessToken } from '../auth/tokenStore'

// Sign in and keep the new access token in memory.
export async function loginRequest(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  setAccessToken(data.access_token)
  return data
}

// Trade the refresh cookie for a new access token.
export async function refreshSessionRequest() {
  const { data } = await api.post('/auth/refresh')
  setAccessToken(data.access_token)
  return data
}

// Ask the API to clear the refresh cookie, then drop our access token.
export async function logoutRequest() {
  try {
    await api.post('/auth/logout')
  } finally {
    clearAccessToken()
  }
}

// Profile for the signed-in account, including its role.
export async function fetchCurrentAccount() {
  const { data } = await api.get('/auth/me')
  return data
}
