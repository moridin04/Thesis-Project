import api from './api'
import { clearAccessToken, setAccessToken } from '../auth/tokenStore'

export async function loginRequest(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  setAccessToken(data.access_token)
  return data
}

export async function refreshSessionRequest() {
  const { data } = await api.post('/auth/refresh')
  setAccessToken(data.access_token)
  return data
}

export async function logoutRequest() {
  try {
    await api.post('/auth/logout')
  } finally {
    clearAccessToken()
  }
}

export async function fetchCurrentAccount() {
  const { data } = await api.get('/auth/me')
  return data
}
