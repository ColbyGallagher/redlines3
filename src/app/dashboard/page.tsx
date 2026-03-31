import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ReviewsDataTable } from "@/components/dashboard/reviews-table/data-table"
import { ProjectsDataTable } from "@/components/dashboard/projects-table/data-table"
import { getProjectSummaries } from "@/lib/data/projects"
import { getReviewSummaries } from "@/lib/data/reviews"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { ClickToScroll } from "@/components/dashboard/click-to-scroll"
import { DashboardActions } from "@/components/dashboard/dashboard-actions"
import { ActiveProjectTracker } from "@/components/projects/active-project-tracker"

export const dynamic = "force-dynamic"

export default async function Page() {
  const [projectSummaries, reviewSummaries] = await Promise.all([
    getProjectSummaries(),
    getReviewSummaries(),
  ])
  const totalClosedIssues = projectSummaries.reduce(
    (count, summary) => count + summary.metrics.closedIssues,
    0,
  )

  return (
    <div className="flex flex-1 flex-col">
      <ActiveProjectTracker projectId={undefined} />
      <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex w-full items-center justify-between gap-4 px-4">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage>Home</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex flex-1 items-center justify-end gap-3">
              <div className="relative w-full max-w-sm">
                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  type="search"
                  placeholder="Search your workspace..."
                  aria-label="Search workspace"
                  className="pl-9"
                />
              </div>
              <DashboardActions />
            </div>
          </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-4">
          <section className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">Welcome to Redlines Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Placeholder metrics to illustrate how project reviews, approvals, and upcoming checkpoints will surface here after login.
            </p>
          </section>
          <section className="grid gap-4 md:grid-cols-2">
            <Card className="flex flex-col">
              <CardHeader>
                <CardTitle>Active Projects</CardTitle>
                <CardDescription>Total projects with ongoing review work.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div>
                  <p className="text-3xl font-semibold">{projectSummaries.length}</p>
                  <p className="text-muted-foreground text-xs">
                    Projects with recent document coordination.
                  </p>
                </div>
                {projectSummaries.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recent activity</p>
                      <div className="space-y-2">
                        {projectSummaries
                          .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
                          .slice(0, 3)
                          .map((summary) => (
                            <div key={summary.project.id} className="flex items-center justify-between gap-2 text-sm">
                              <Link 
                                href={`/${summary.project.slug}`}
                                className="font-medium hover:underline truncate"
                              >
                                {summary.project.projectName}
                              </Link>
                              <span className="text-[10px] text-muted-foreground font-medium px-1.5 py-0.5 rounded-md border border-border bg-muted/30 shrink-0">
                                {summary.project.projectNumber}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col">
              <ClickToScroll targetId="review-tracker" className="cursor-pointer transition-colors hover:bg-muted/30">
                <CardHeader>
                  <CardTitle>Open Reviews</CardTitle>
                  <CardDescription>Reviews awaiting attention across your portfolio.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-3xl font-semibold">{reviewSummaries.length}</p>
                    <p className="text-muted-foreground text-xs">
                      Total active reviews across all projects.
                    </p>
                  </div>
                </CardContent>
              </ClickToScroll>
              <CardContent className="flex-1 space-y-4 pt-0">
                {reviewSummaries.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Urgent attention</p>
                      <div className="space-y-2">
                        {reviewSummaries
                          .filter(r => r.status !== 'Approved')
                          .sort((a, b) => {
                            if (!a.dueDate) return 1
                            if (!b.dueDate) return -1
                            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
                          })
                          .slice(0, 3)
                          .map((review) => (
                            <div key={review.id} className="flex items-center justify-between gap-2 text-sm">
                              <div className="flex flex-col truncate">
                                <Link 
                                  href={`/${review.project?.slug ?? 'unknown'}/${review.slug}`}
                                  className="font-medium hover:underline truncate"
                                >
                                  {review.reviewName}
                                </Link>
                                <span className="text-muted-foreground text-[10px] truncate">
                                  {review.project?.name}
                                </span>
                              </div>
                              {review.dueDate && (
                                <span className={cn(
                                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full border shrink-0",
                                  new Date(review.dueDate) < new Date() 
                                    ? "text-destructive border-destructive/30 bg-destructive/10" 
                                    : "text-muted-foreground border-border bg-muted/50"
                                )}>
                                  {new Date(review.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </span>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>


          </section>
          <section id="project-tracker" className="rounded-lg border bg-card p-6">
            <div className="mb-4 space-y-1">
              <h2 className="text-xl font-semibold">Project Tracker</h2>
              <p className="text-muted-foreground text-sm">
                Manage your projects with detailed metrics and coordinate upcoming reviews.
              </p>
            </div>
            <ProjectsDataTable data={projectSummaries} />
          </section>

          <Separator />

          <section id="review-tracker" className="rounded-lg border bg-card p-6">
            <div className="mb-4 space-y-1">
              <h2 className="text-xl font-semibold">Review Tracker</h2>
              <p className="text-muted-foreground text-sm">
                Explore reviews with column controls, row selection, and quick filters.
              </p>
            </div>
            <ReviewsDataTable data={reviewSummaries} />
          </section>
      </div>
    </div>
  )
}
