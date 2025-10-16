import type { ReactNode } from "react"
import { CheckCircle2 } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { ProjectSummary } from "@/lib/data/projects"

type ProjectSummaryHeaderProps = {
  summary: ProjectSummary
  actions?: ReactNode
  successMessage?: string
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

function formatLastUpdated(value: string) {
  const date = value ? new Date(value) : undefined
  if (!date || Number.isNaN(date.getTime())) {
    return "Not available"
  }

  return dateFormatter.format(date)
}

function formatPlural(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function ProjectSummaryHeader({ summary, actions, successMessage }: ProjectSummaryHeaderProps) {
  const lastUpdatedLabel = formatLastUpdated(summary.lastUpdated)

  const metricsCards = [
    {
      title: "Reviews",
      value: summary.metrics.totalReviews.toString(),
      description: `${formatPlural(summary.metrics.upcomingReviews, "upcoming review", "upcoming reviews")} · ${formatPlural(summary.metrics.overdueReviews, "overdue", "overdue")}`,
    },
    {
      title: "Issues",
      value: summary.metrics.totalIssues.toString(),
      description: `${formatPlural(summary.metrics.openIssues, "open issue", "open issues")} · ${formatPlural(summary.metrics.highPriorityIssues, "high priority", "high priority")}`,
    },
    {
      title: "Health",
      value: `${summary.metrics.longOpenIssues}`,
      description: `${formatPlural(summary.metrics.longOpenIssues, "issue", "issues")} open 14+ days`,
    },
  ]

  return (
    <div className="border-b bg-background">
      <div className="flex flex-col gap-6 p-6 pb-4">
        {successMessage ? (
          <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <p className="text-sm font-medium leading-relaxed">{successMessage}</p>
          </div>
        ) : null}
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{summary.project.projectName}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {summary.project.projectName}
                </h1>
                <Badge variant="outline">{summary.project.projectNumber}</Badge>
              </div>
              {summary.project.projectLocation ? (
                <p className="text-muted-foreground text-sm">
                  {summary.project.projectLocation}
                </p>
              ) : null}
            </div>
          </div>

          <div className="flex items-start gap-4">
            {actions ? <div className="flex-shrink-0 self-start">{actions}</div> : null}
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Last updated</p>
              <p className="text-sm">{lastUpdatedLabel}</p>
            </div>
          </div>
        </header>

        <Separator />

        <section className="grid gap-4 md:grid-cols-3">
          {metricsCards.map((metric) => (
            <Card key={metric.title}>
              <CardHeader className="space-y-1">
                <CardTitle className="text-base font-medium">{metric.title}</CardTitle>
                <CardDescription>{metric.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{metric.value}</p>
              </CardContent>
            </Card>
          ))}
        </section>
      </div>
    </div>
  )
}

