"use client"

import { useEffect } from "react"
import { useNavigation } from "@/components/providers/navigation-provider"

type ActiveProjectTrackerProps = {
  projectId: string | undefined
}

/**
 * A client component that reports the current project ID to the global navigation context.
 * Place this on project-specific pages.
 */
export function ActiveProjectTracker({ projectId }: ActiveProjectTrackerProps) {
  const { setActiveProjectId } = useNavigation()

  useEffect(() => {
    setActiveProjectId(projectId)
    
    // Cleanup is handled by the Home pages calling this with undefined
    // or by another page's tracker overwriting it.
  }, [projectId, setActiveProjectId])

  return null
}
