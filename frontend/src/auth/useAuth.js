/*
 * Read the current account, role, and auth actions.
 * Pages call this. The value comes from AuthProvider in main.jsx.
 * AuthContext.js is the context object this hook reads.
 */
import { useContext } from 'react'
import { AuthContext } from './AuthContext'

// Throws when a component is rendered outside AuthProvider.
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
