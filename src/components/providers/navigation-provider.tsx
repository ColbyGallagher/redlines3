"use client"

import { createContext, useContext, useState, ReactNode, useCallback } from "react"

type NavigationContextType = {
  activeProjectId: string | undefined
  setActiveProjectId: (id: string | undefined) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeProjectId, setActiveProjectId] = useState<string | undefined>(undefined)

  const setProject = useCallback((id: string | undefined) => {
    setActiveProjectId(id)
  }, [])

  return (
    <NavigationContext.Provider value={{ activeProjectId, setActiveProjectId: setProject }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider")
  }
  return context
}
