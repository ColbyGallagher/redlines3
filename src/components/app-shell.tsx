"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, useSidebar } from "@/components/ui/sidebar"
import { NavigationProvider } from "@/components/providers/navigation-provider"

type AppShellProps = {
  children: React.ReactNode
}

const PUBLIC_PATHS = ["/", "/login"]

function SidebarCollapser() {
  const pathname = usePathname()
  const { setOpen } = useSidebar()

  React.useEffect(() => {
    // Collapse sidebar when entering a document review page
    if (pathname.match(/^\/reviews\/[^/]+\/documents\/[^/]+/)) {
      setOpen(false)
    }
  }, [pathname, setOpen])

  return null
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  if (isPublic) {
    return <main className="flex min-h-screen flex-col">{children}</main>
  }

  return (
    <NavigationProvider>
      <SidebarProvider>
        <SidebarCollapser />
        <AppSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </NavigationProvider>
  )
}
