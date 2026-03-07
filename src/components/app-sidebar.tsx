"use client"

import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Folder,
  LayoutDashboard,
  Settings,
  Settings2,
  ShieldCheck,
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
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
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

type SidebarCompany = {
  id: string
  name: string
  plan: string
  active: boolean
}

type SidebarReview = {
  id: string
  name: string
  href: string
}

type SidebarApiResponse = {
  projects: SidebarProject[]
  companies: SidebarCompany[]
  reviews: SidebarReview[]
  user?: {
    first_name: string
    last_name: string
    email: string
  } | null
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
  const { state } = useSidebar()
  const [projects, setProjects] = useState<SidebarProject[]>([])
  const [companies, setCompanies] = useState<SidebarCompany[]>([])
  const [recentReviews, setRecentReviews] = useState<SidebarReview[]>([])
  const [user, setUser] = useState(data.user)
  const [sidebarError, setSidebarError] = useState<string | null>(null)
  const [isLoadingSidebar, setIsLoadingSidebar] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

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
        setCompanies(payload.companies || [])
        setRecentReviews(payload.reviews)
        if (payload.user) {
          setUser({
            name: [payload.user.first_name, payload.user.last_name].filter(Boolean).join(" ") || "User",
            email: payload.user.email,
            avatar: "",
            roles: (payload.user as any).roles || [],
          } as any)
        }
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

  const isDashboardActive = useMemo(() => {
    if (!pathname) return false
    return pathname === "/" || pathname.startsWith("/dashboard")
  }, [pathname])

  const activeProjectId = useMemo(() => {
    if (!pathname) return undefined
    const match = pathname.match(/^\/projects\/([^/]+)/)
    return match ? match[1] : undefined
  }, [pathname])
  const isAdmin = useMemo(() => {
    if (!user || !(user as any).roles) return false
    const roles = (user as any).roles as string[]
    return roles.includes("developer") || roles.includes("org admin")
  }, [user])

  if (!isMounted) {
    return null
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-1 group-data-[state=collapsed]:justify-center">
          <div className="group-data-[state=collapsed]:hidden flex-1">
            <TeamSwitcher
              teams={companies.map(c => ({
                id: c.id,
                name: c.name,
                logo: Folder,
                plan: c.plan
              }))}
            />
          </div>
          <SidebarTrigger className="hidden md:flex" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isDashboardActive} tooltip="Dashboard">
                <Link href="/dashboard">
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </Link>
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
                <Link href="#">
                  <BookOpen />
                  <span>Tutorials</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/settings"} tooltip="Settings">
                <Link href="/settings">
                  <Settings />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {isAdmin && (
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin"} tooltip="Admin">
                  <Link href="/admin">
                    <ShieldCheck />
                    <span>Admin</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
