import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { IssuesDataTable } from "@/components/dashboard/issues-table/data-table"
import { getProjectSummaries } from "@/lib/data/projects"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { ActiveProjectTracker } from "@/components/projects/active-project-tracker"

export const dynamic = "force-dynamic"

export default async function IssuesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  let userFullName = ""
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single()
    
    if (profile) {
      const p = profile as { first_name: string | null; last_name: string | null }
      userFullName = [p.first_name, p.last_name].filter(Boolean).join(" ")
    }
  }

  const projectSummaries = await getProjectSummaries()
  const allIssues = projectSummaries.flatMap(ps => ps.issues)

  if (process.env.NODE_ENV === "development") {
    console.log(`[IssuesPage] Fetched ${allIssues.length} issues across ${projectSummaries.length} projects.`)
    const myIssues = allIssues.filter(i => i.authorName === userFullName)
    console.log(`[IssuesPage] Found ${myIssues.length} issues matching author name: "${userFullName}"`)
    if (allIssues.length > 0 && myIssues.length === 0) {
      console.log(`[IssuesPage] First few authors: ${allIssues.slice(0, 5).map(i => `"${i.authorName}"`).join(", ")}`)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <ActiveProjectTracker projectId={undefined} />
      <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Issues</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6 pt-4">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Issue Tracker</h1>
          <p className="text-muted-foreground text-sm">
            All issues across all reviews you have access to. Filter and search as needed.
          </p>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 space-y-1 text-sm">
            <h2 className="text-lg font-medium">Global Issues</h2>
            <p className="text-muted-foreground">
              Review coordination tracker. Use the filters to find specific issues.
            </p>
          </div>
          <IssuesDataTable data={allIssues} initialAuthorFilter={userFullName} />
        </section>
      </main>
    </div>
  )
}
