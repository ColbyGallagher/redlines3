import Link from "next/link"
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
import { ReviewsDataTable } from "@/components/dashboard/reviews-table/data-table"
import { getReviewSummaries } from "@/lib/data/reviews"
import { ActiveProjectTracker } from "@/components/projects/active-project-tracker"

export const dynamic = "force-dynamic"

const ACTIVE_STATUSES = ["Draft", "In Review", "Awaiting Client", "Flagged"]

export default async function ReviewsPage() {
  const reviews = await getReviewSummaries()

  // Sort: Active first, then by date (most recent first)
  const sortedReviews = [...reviews].sort((a, b) => {
    const aIsActive = ACTIVE_STATUSES.includes(a.status)
    const bIsActive = ACTIVE_STATUSES.includes(b.status)

    if (aIsActive && !bIsActive) return -1
    if (!aIsActive && bIsActive) return 1

    // If both same "activeness", sort by due date or name
    if (a.dueDate && b.dueDate) {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }
    return a.reviewName.localeCompare(b.reviewName)
  })

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
                  <BreadcrumbPage>Reviews</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6 pt-4">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Review Tracker</h1>
          <p className="text-muted-foreground text-sm">
            All active and completed reviews across your portfolio.
          </p>
        </section>

        <section className="rounded-lg border bg-card p-6">
          <div className="mb-4 space-y-1 text-sm">
            <h2 className="text-lg font-medium">All Reviews</h2>
            <p className="text-muted-foreground">
              Filter by project, status, or due date. Active reviews are shown first.
            </p>
          </div>
          <ReviewsDataTable data={sortedReviews} />
        </section>
      </main>
    </div>
  )
}
