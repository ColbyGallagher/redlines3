"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { useRouter } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuButton } from "@/components/ui/sidebar"

type Project = {
  id: string
  slug: string
  name: string
}

type ProjectSwitcherProps = {
  projects: Project[]
  activeProjectId?: string
  isDashboardActive: boolean
  loading: boolean
  error: string | null
}

export function ProjectSwitcher({
  projects,
  activeProjectId,
  isDashboardActive,
  loading,
  error,
}: ProjectSwitcherProps) {
  const router = useRouter()
  const activeProject = React.useMemo(() => {
    if (!activeProjectId) return undefined
    return projects.find((project) => project.id === activeProjectId)
  }, [activeProjectId, projects])

  const label = activeProject && !isDashboardActive ? activeProject.name : "Select project"
  const disabled = loading || Boolean(error)

  const handleProjectSelect = React.useCallback(
    (project: Project) => {
      if (!project.id || project.id === activeProjectId) {
        return
      }
      void router.push(`/${project.slug}`)
    },
    [activeProjectId, router],
  )

  const handleAllProjects = React.useCallback(() => {
    void router.push("/projects")
  }, [router])

  return (
    <div className="group-data-[collapsible=icon]:hidden">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton
            size="lg"
            className="w-full justify-between"
            aria-disabled={disabled}
            data-disabled={disabled ? true : undefined}
          >
            <span className="truncate text-sm font-medium">{label}</span>
            <ChevronDown className="size-4 text-sidebar-foreground/70" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 min-w-[15rem] rounded-lg border border-border bg-popover p-1 shadow-lg"
          align="start"
          sideOffset={4}
        >
          {loading ? (
            <DropdownMenuItem disabled className="text-sm text-muted-foreground">
              Loading projects…
            </DropdownMenuItem>
          ) : error ? (
            <DropdownMenuItem disabled className="text-sm text-destructive">
              {error}
            </DropdownMenuItem>
          ) : projects.length === 0 ? (
            <DropdownMenuItem disabled className="text-sm text-muted-foreground">
              No projects available
            </DropdownMenuItem>
          ) : (
            projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onSelect={() => handleProjectSelect(project)}
                className="flex items-center justify-between gap-2 truncate text-sm"
              >
                <span className="truncate">{project.name}</span>
                {project.id === activeProjectId && (
                  <Check className="size-4 text-sidebar-accent-foreground" />
                )}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleAllProjects} className="text-sm">
            All projects
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
