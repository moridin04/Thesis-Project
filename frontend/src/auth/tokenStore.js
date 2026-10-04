/*
 * In-memory access token for API calls.
 * We do not put it in localStorage. A reload uses the refresh cookie.
 * api.js reads it. AuthProvider and authService write it.
 */
// Null until login or a successful refresh.
let accessToken = null

// Bearer token for this tab, or null when signed out.
export function getAccessToken() {
  return accessToken
}

// Save the token from login or /auth/refresh. It is not written to disk.
export function setAccessToken(token) {
  accessToken = token
}

// Forget the token on logout or when refresh fails.
export function clearAccessToken() {
  accessToken = null
}
