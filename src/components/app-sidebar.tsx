"use client"

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
import { useEffect, useMemo, useState } from "react"
import { NavProjects } from "@/components/nav-projects"
import { ProjectSettingsSheet } from "@/components/projects/project-settings-sheet"

type SidebarProject = {
  id: string
  name: string
  url: string
}

type SidebarReview = {
  id: string
  name: string
  href: string
}

type SidebarApiResponse = {
  projects: SidebarProject[]
  reviews: SidebarReview[]
}

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
  const [projects, setProjects] = useState<SidebarProject[]>([])
  const [recentReviews, setRecentReviews] = useState<SidebarReview[]>([])
  const [sidebarError, setSidebarError] = useState<string | null>(null)
  const [isLoadingSidebar, setIsLoadingSidebar] = useState(true)

  useEffect(() => {
    async function loadSidebarData() {
      try {
        const response = await fetch("/api/sidebar", {
          cache: "no-store",
          headers: {
            Accept: "application/json",
          },
        })

        if (!response.ok) {
          const payload = await response
            .json()
            .catch(() => ({ error: `Request failed with status ${response.status}` }))
          setProjects([])
          setRecentReviews([])
          setSidebarError(
            typeof payload.error === "string"
              ? payload.error
              : `Request failed with status ${response.status}`,
          )
          setProjects([])
          setRecentReviews([])
          return
        }

        const payload = (await response.json()) as SidebarApiResponse
        setProjects(payload.projects)
        setRecentReviews(payload.reviews)
        setSidebarError(null)
      } catch (error) {
        console.error("Failed to load sidebar data", error)
        setSidebarError(error instanceof Error ? error.message : "Unable to load sidebar content")
      } finally {
        setIsLoadingSidebar(false)
      }
    }

    void loadSidebarData()
  }, [])

  const isOverviewActive = useMemo(() => {
    if (!pathname) return false
    return pathname === "/" || pathname.startsWith("/dashboard")
  }, [pathname])

  const activeProjectId = useMemo(() => {
    if (!pathname) return undefined
    const match = pathname.match(/^\/projects\/([^/]+)/)
    return match ? match[1] : undefined
  }, [pathname])

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

        {isLoadingSidebar ? (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Status</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="justify-start text-muted-foreground">
                  Loading sidebar content…
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : null}

        {sidebarError ? (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Status</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton disabled className="justify-start text-destructive">
                  {sidebarError}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        ) : null}

        <NavProjects projects={projects.map((project) => ({
          id: project.id,
          name: project.name,
          url: `/projects/${project.id}`,
        }))} />

        {activeProjectId ? (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Project tools</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <ProjectSettingsSheet
                  projectId={activeProjectId}
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
