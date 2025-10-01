"use client"

import * as React from "react"
import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Folder,
  LayoutDashboard,
  Settings,
  Settings2,
  SlidersHorizontal,
  Users,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { NavProjects } from "@/components/nav-projects"
import { ProjectSettingsSheet } from "@/components/projects/project-settings-sheet"
import { getProjectSummaries, getProjectSummaryById } from "@/lib/mock/projects"
import { reviewDetails } from "@/lib/mock/review-details"

const projectSummaries = getProjectSummaries()
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: Folder,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: Folder,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Folder,
      plan: "Free",
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()

  const isOverviewActive = React.useMemo(() => {
    if (!pathname) return false
    return pathname === "/" || pathname.startsWith("/dashboard")
  }, [pathname])

  const activeProjectId = React.useMemo(() => {
    if (!pathname) return undefined
    const match = pathname.match(/^\/projects\/([^/]+)/)
    return match ? match[1] : undefined
  }, [pathname])

  const activeProject = React.useMemo(() => {
    if (!activeProjectId) return undefined
    return getProjectSummaryById(activeProjectId)
  }, [activeProjectId])

  const recentReviews = React.useMemo(() => {
    return [...reviewDetails]
      .sort((a, b) => {
        const aTime = new Date(a.lastUpdated).getTime()
        const bTime = new Date(b.lastUpdated).getTime()

        if (Number.isNaN(aTime) && Number.isNaN(bTime)) return 0
        if (Number.isNaN(aTime)) return 1
        if (Number.isNaN(bTime)) return -1
        return bTime - aTime
      })
      .slice(0, 5)
      .map((review) => ({
        id: review.id,
        name: review.reviewName,
        href: `/reviews/${review.id}`,
      }))
  }, [])

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isOverviewActive} tooltip="Overview">
                <a href="/dashboard">
                  <LayoutDashboard />
                  <span>Overview</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <NavProjects
          projects={projectSummaries.map((summary) => ({
            id: summary.project.id,
            name: summary.project.projectName,
            url: `/projects/${summary.project.id}`,
          }))}
        />

        {activeProject ? (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Project tools</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <ProjectSettingsSheet
                  projectId={activeProject.project.id}
                  trigger={
                    <SidebarMenuButton tooltip="Project settings">
                      <Settings2 />
                      <span>Project settings</span>
                    </SidebarMenuButton>
                  }
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : null}

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Recent reviews</SidebarGroupLabel>
          <SidebarMenu>
            {recentReviews.map((review) => {
              const isActive = pathname?.startsWith(`/reviews/${review.id}`)

              return (
                <SidebarMenuItem key={review.id}>
                  <SidebarMenuButton asChild tooltip={review.name} isActive={isActive}>
                    <Link href={review.href}>
                      <ClipboardList />
                      <span>{review.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Tutorials">
                <a href="#">
                  <BookOpen />
                  <span>Tutorials</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarMenu>
            <Collapsible asChild>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip="Settings">
                    <Settings />
                    <span>Settings</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="#">
                          <SlidersHorizontal />
                          <span>General</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href="#">
                          <Users />
                          <span>Team</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
