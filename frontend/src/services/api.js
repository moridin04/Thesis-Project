/*
 * Axios client used by every service in this folder.
 * Sends the access token from tokenStore.js and refreshes it after a 401.
 * The refresh call relies on the HttpOnly cookie from /auth/refresh.
 */
import axios from 'axios'
import { clearAccessToken, getAccessToken, setAccessToken } from '../auth/tokenStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api',
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add the bearer token when we have one. Public routes work without it.
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// One in-flight refresh so parallel 401s share a single /auth/refresh call.
let refreshPromise = null

// Ask the API for a new access token and keep it in memory.
async function performRefresh() {
  const { data } = await api.post('/auth/refresh')
  setAccessToken(data.access_token)
  return data.access_token
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const requestUrl = originalRequest?.url ?? ''
    // Login, refresh, and logout must not start another refresh loop.
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout')

    if (
      status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint
    ) {
      return Promise.reject(error)
    }

    // A second 401 on this same request should not refresh again.
    originalRequest._retry = true

    try {
      if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
          refreshPromise = null
        })
      }
      const token = await refreshPromise
      originalRequest.headers.Authorization = `Bearer ${token}`
      return api(originalRequest)
    } catch (refreshError) {
      // Refresh failed, so drop the access token and leave the user signed out.
      clearAccessToken()
      return Promise.reject(refreshError)
    }
  },
)

export default api
