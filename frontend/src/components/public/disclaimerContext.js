import { createContext, useContext } from 'react'

export const DisclaimerContext = createContext({
  reopen: () => {},
  isOpen: false,
})

export function useDisclaimer() {
  return useContext(DisclaimerContext)
}
