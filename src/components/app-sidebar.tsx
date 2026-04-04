"use client"

import {
  BookOpen,
  ChevronRight,
  ClipboardList,
  Folder,
  Home,
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
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
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
import { ProjectSwitcher } from "@/components/project-switcher"
import { ProjectSettingsSheet } from "@/components/projects/project-settings-sheet"
import { useNavigation } from "@/components/providers/navigation-provider"

type SidebarProject = {
  id: string
  slug: string
  name: string
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
  projectId: string | null
  projectName: string
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

const data: {
  user: {
    name: string
    email: string
    avatar: string | undefined
  }
  teams: any[]
} = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/redlines_logo.png",
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
            avatar: undefined,
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

  const { activeProjectId: contextProjectId } = useNavigation()

  const activeProjectId = useMemo(() => {
    if (contextProjectId) return contextProjectId
    if (!pathname) return undefined
    
    // We are looking for /[projectSlug] or /[projectSlug]/[reviewSlug]
    // Filter out reserved non-project roots
    const reservedRoots = ["/dashboard", "/projects", "/admin", "/api", "/auth"]
    if (reservedRoots.some(root => pathname.startsWith(root)) || pathname === "/") {
      return undefined
    }
    
    // Try to get the projectSlug from the path which is the first segment
    const match = pathname.match(/^\/([^/]+)/)
    if (match) {
      const slug = match[1]
      const foundProject = projects.find(p => p.slug === slug)
      if (foundProject) {
        return foundProject.id
      }
    }
    return undefined
  }, [pathname, contextProjectId, projects])
  const isAdmin = useMemo(() => {
    if (!user || !(user as any).roles) return false
    const roles = (user as any).roles as string[]
    return roles.includes("developer") || roles.includes("org admin")
  }, [user])

  const sidebarTeams = useMemo(
    () =>
      companies.map((company) => ({
        id: company.id,
        name: company.name,
        logo: Folder,
        plan: company.plan,
        active: company.active,
      })),
    [companies],
  )


  if (!isMounted) {
    return null
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ProjectSwitcher
              projects={projects}
              activeProjectId={activeProjectId}
              isDashboardActive={isDashboardActive}
              loading={isLoadingSidebar}
              error={sidebarError}
            />
          </div>
          <SidebarTrigger className="hidden md:flex" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={isDashboardActive} tooltip="Home">
                <Link href="/dashboard">
                  <Home />
                  <span>Home</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Browse</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/projects"} tooltip="Projects">
                <Link href="/projects">
                  <Folder />
                  <span>Projects</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/reviews"} tooltip="Reviews">
                <Link href="/reviews">
                  <ClipboardList />
                  <span>Reviews</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname === "/issues"} tooltip="Issues">
                <Link href="/issues">
                  <ShieldCheck />
                  <span>Issues</span>
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
              const isActive = pathname?.startsWith(review.href)

              return (
                <SidebarMenuItem key={review.id}>
                  <SidebarMenuButton asChild tooltip={review.name} isActive={isActive} size="lg">
                    <Link href={review.href}>
                      <ClipboardList />
                      <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                        <span className="text-[10px] text-muted-foreground truncate">
                          {review.projectName || "Unassigned project"}
                        </span>
                        <span className="font-medium truncate">{review.name}</span>
                      </div>
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
        <NavUser user={user} teams={sidebarTeams} isAdmin={isAdmin} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
