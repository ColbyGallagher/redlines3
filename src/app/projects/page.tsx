import Link from "next/link"

import { CreateProjectWizard } from "@/components/create-project-wizard"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getProjectSummaries } from "@/lib/mock/projects"

function formatDate(value: string) {
  if (!value || value === new Date(0).toISOString()) {
    return "—"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

export default function ProjectsPage() {
  const projectSummaries = getProjectSummaries()

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex w-full items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Projects</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2">
            <CreateProjectWizard />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6 pt-4">
        <section className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground text-sm">
            Browse the projects your team can access and jump into detailed reviews.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Project directory</CardTitle>
            <CardDescription>Overview of all shared projects, their activity, and quick links.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Number</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Reviews</TableHead>
                  <TableHead className="text-right">Open issues</TableHead>
                  <TableHead>Last updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectSummaries.length ? (
                  projectSummaries.map((summary) => (
                    <TableRow key={summary.project.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/projects/${summary.project.id}`}
                          className="hover:text-primary"
                        >
                          {summary.project.projectName}
                        </Link>
                      </TableCell>
                      <TableCell>{summary.project.projectNumber}</TableCell>
                      <TableCell>{summary.project.projectLocation}</TableCell>
                      <TableCell className="text-right">
                        {summary.metrics.totalReviews}
                      </TableCell>
                      <TableCell className="text-right">
                        {summary.metrics.openIssues}
                      </TableCell>
                      <TableCell>{formatDate(summary.lastUpdated)}</TableCell>
                      <TableCell className="text-right">
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/projects/${summary.project.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                      No projects available yet. Create a new project to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}


