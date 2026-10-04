/*
 * React context for the signed-in account.
 * AuthProvider fills it. Pages read it through useAuth.js.
 * The default is null so useAuth can tell when the provider is missing.
 */
import { createContext } from 'react'

// Null default. useAuth throws if a component sits outside the provider.
export const AuthContext = createContext(null)
