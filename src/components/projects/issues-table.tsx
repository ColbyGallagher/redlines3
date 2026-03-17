"use client"

import * as React from "react"
import { ChevronDown, Filter, Search } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ProjectIssueSummary, ProjectSummary } from "@/lib/data/projects"
import { CreateIssueDialog } from "@/components/projects/create-issue-dialog"

type IssuesTableProps = {
  issues: ProjectIssueSummary[]
  summary: ProjectSummary
}

const STATUS_ORDER: ProjectIssueSummary["status"][] = ["Open", "In Progress", "Resolved", "Closed"]

function sortIssues(issues: ProjectIssueSummary[]) {
  return [...issues].sort((a, b) => {
    const statusDelta = STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status)
    if (statusDelta !== 0) {
      return statusDelta
    }

    return b.dateModified.localeCompare(a.dateModified)
  })
}

const statusTone: Record<ProjectIssueSummary["status"], string> = {
  Open: "bg-destructive/10 text-destructive",
  "In Progress": "bg-amber-500/10 text-amber-600",
  Resolved: "bg-emerald-500/10 text-emerald-600",
  Closed: "bg-muted text-muted-foreground",
}

const importanceTone: Record<string, string> = {
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-amber-500/10 text-amber-600",
  Low: "bg-primary/10 text-primary",
}

const updatedDateFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})

export function IssuesTable({ issues, summary }: IssuesTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<ProjectIssueSummary["status"] | "All">("All")

  const filteredIssues = React.useMemo(() => {
    let nextIssues = sortIssues(issues)

    if (statusFilter !== "All") {
      nextIssues = nextIssues.filter((issue) => issue.status === statusFilter)
    }

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase()
      nextIssues = nextIssues.filter((issue) =>
        issue.issueNumber.toLowerCase().includes(query) ||
        issue.discipline.toLowerCase().includes(query) ||
        issue.importance.toLowerCase().includes(query) ||
        issue.status.toLowerCase().includes(query),
      )
    }

    return nextIssues
  }, [issues, searchTerm, statusFilter])

  return (
    <Card className="lg:col-span-7 xl:col-span-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Issues</CardTitle>
          <CardDescription>Monitor open items and track response health</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <CreateIssueDialog
            projectId={summary.project.id}
            reviews={summary.reviews}
            settings={summary.settings}
            members={summary.members}
            documents={summary.allReviewDocuments}
          />
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search issues"
              className="w-[180px] pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="size-4" />
                {statusFilter === "All" ? "All statuses" : statusFilter}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem
                checked={statusFilter === "All"}
                onCheckedChange={() => setStatusFilter("All")}
              >
                All statuses
              </DropdownMenuCheckboxItem>
              {STATUS_ORDER.map((status) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={statusFilter === status}
                  onCheckedChange={() => setStatusFilter(status)}
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[120px]">Issue</TableHead>
                <TableHead className="min-w-[140px]">Discipline</TableHead>
                <TableHead className="min-w-[100px]">Importance</TableHead>
                <TableHead className="min-w-[90px]">Status</TableHead>
                <TableHead className="min-w-[120px] text-right">Age</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    No issues match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredIssues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell className="align-top">
                      <div className="space-y-1">
                        <p className="font-medium leading-tight">{issue.issueNumber}</p>
                        <p className="text-muted-foreground text-xs">Updated {updatedDateFormatter.format(new Date(issue.dateModified))}</p>
                      </div>
                    </TableCell>
                    <TableCell className="align-top">
                      <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium uppercase tracking-wide">
                        {issue.discipline}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium uppercase tracking-wide ${importanceTone[issue.importance] ?? "bg-muted text-muted-foreground"
                        }`}>
                        {issue.importance}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusTone[issue.status]}`}>
                        {issue.status}
                      </span>
                    </TableCell>
                    <TableCell className="align-top text-right">
                      <p className="font-medium">{issue.ageDays} day{issue.ageDays === 1 ? "" : "s"}</p>
                      {issue.isLongOpen ? (
                        <p className="text-destructive text-xs">Long open</p>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

