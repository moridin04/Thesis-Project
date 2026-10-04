/*
 * Lets the footer and the priority map reopen the disclaimer.
 * DisclaimerGate provides reopen and isOpen. useDisclaimer reads them.
 * Until the provider mounts, reopen does nothing and isOpen is false.
 */
import { createContext, useContext } from 'react'

// Default so a button outside the provider does not crash.
export const DisclaimerContext = createContext({
  reopen: () => {},
  isOpen: false,
})

// Footer and map buttons call reopen from this context.
export function useDisclaimer() {
  return useContext(DisclaimerContext)
}
