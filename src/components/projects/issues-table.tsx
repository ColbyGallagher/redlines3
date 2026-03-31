"use client"

import * as React from "react"
import Link from "next/link"
import { ChevronDown, Filter, Search, ArrowUpDown, Check, Loader2, LayoutGrid, Table2 } from "lucide-react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { updateIssue, bulkUpdateIssues } from "@/lib/actions/issues"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { ProjectIssueSummary, ProjectSummary } from "@/lib/data/projects"
import { CreateIssueDialog } from "@/components/projects/create-issue-dialog"

const IssuesGlideGrid = dynamic(
  () => import("@/components/projects/issues-glide-grid").then((m) => m.IssuesGlideGrid),
  { ssr: false, loading: () => <div className="h-[600px] w-full animate-pulse rounded-md bg-muted" /> },
)

type ViewMode = "table" | "grid"

type IssuesTableProps = {
  issues: ProjectIssueSummary[]
  summary: ProjectSummary
  currentUserId?: string | null
  isAdmin?: boolean
  userRole?: string | null
  userCompanyId?: string | null
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

export function IssuesTable({ 
  issues, 
  summary,
  currentUserId,
  isAdmin,
  userRole,
  userCompanyId
}: IssuesTableProps) {
  const router = useRouter()
  const [viewMode, setViewMode] = React.useState<ViewMode>("table")
  const [searchTerm, setSearchTerm] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<string | "All">("All")
  const [disciplineFilter, setDisciplineFilter] = React.useState<string | "All">("All")
  const [importanceFilter, setImportanceFilter] = React.useState<string | "All">("All")
  const [stateFilter, setStateFilter] = React.useState<string | "All">("All")
  const [classificationFilter, setClassificationFilter] = React.useState<string | "All">("All")
  const [milestoneFilter, setMilestoneFilter] = React.useState<string | "All">("All")
  
  const [sortKey, setSortKey] = React.useState<keyof ProjectIssueSummary>("status")
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc")
  const [updatingId, setUpdatingId] = React.useState<string | null>(null)
  
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [isBulkUpdating, setIsBulkUpdating] = React.useState(false)

  const canEditIssue = React.useCallback((issue: ProjectIssueSummary) => {
    if (isAdmin) return true
    
    // If no phase is active, fall back to author check
    if (!issue.reviewPhaseId) {
      return issue.createdByUserId === currentUserId
    }

    const phase = summary.settings.phases.find(p => p.id === issue.reviewPhaseId)
    if (!phase) {
      return issue.createdByUserId === currentUserId
    }

    // Check company access
    const phasePermissions = phase.permissions as any
    const allowedCompanies = phasePermissions?.companies || []
    if (allowedCompanies.length > 0 && !allowedCompanies.includes(userCompanyId)) {
      return false
    }

    // Check role capabilities
    const rolePermissions = phasePermissions?.roles || {}
    const capabilities = rolePermissions[userRole || ""] || []
    
    if (issue.createdByUserId === currentUserId) {
      return capabilities.includes("edit_own") || capabilities.includes("edit_others")
    }
    
    return capabilities.includes("edit_others")
  }, [isAdmin, currentUserId, summary.settings.phases, userRole, userCompanyId])

  const handleSort = (key: keyof ProjectIssueSummary) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("asc")
    }
  }

  const handleUpdate = async (issueId: string, field: string, value: string) => {
    setUpdatingId(issueId)
    try {
      const fieldMap: Record<string, string> = {
        status: "status",
        importance: "importance",
        discipline: "discipline",
        state: "state",
        classification: "classification",
        milestone: "milestone"
      }

      const dbField = fieldMap[field]
      if (!dbField) return

      // Find the ID for the name if it's a UUID-based field in the DB
      let dbValue = value
      const settings = summary.settings
      
      if (field === "status") dbValue = settings.statuses.find(s => s.name === value)?.id ?? value
      if (field === "importance") dbValue = settings.importances.find(i => i.name === value)?.id ?? value
      if (field === "discipline") dbValue = settings.disciplines.find(d => d.name === value)?.id ?? value
      if (field === "state") dbValue = settings.states.find(s => s.name === value)?.id ?? value
      if (field === "classification") dbValue = settings.classifications.find(c => c.name === value)?.id ?? value
      if (field === "milestone") dbValue = settings.availableMilestones.find(m => m.name === value)?.id ?? value

      const res = await updateIssue(issueId, summary.project.id, { [dbField]: dbValue })
      if (!res.success) {
        toast.error(res.error ?? "Failed to update issue")
      } else {
        toast.success("Issue updated")
        router.refresh()
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred while updating the issue")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleBulkUpdate = async (field: string, value: string, ids?: string[]) => {
    const targetIds = ids || Array.from(selectedIds)
    if (targetIds.length === 0) return
    
    setIsBulkUpdating(true)
    try {
      const fieldMap: Record<string, string> = {
        status: "status",
        importance: "importance",
        discipline: "discipline",
        state: "state",
        classification: "classification",
        milestone: "milestone"
      }

      const dbField = fieldMap[field]
      if (!dbField) return

      let dbValue = value
      const settings = summary.settings
      
      if (field === "status") dbValue = settings.statuses.find(s => s.name === value)?.id ?? value
      if (field === "importance") dbValue = settings.importances.find(i => i.name === value)?.id ?? value
      if (field === "discipline") dbValue = settings.disciplines.find(d => d.name === value)?.id ?? value
      if (field === "state") dbValue = settings.states.find(s => s.name === value)?.id ?? value
      if (field === "classification") dbValue = settings.classifications.find(c => c.name === value)?.id ?? value
      if (field === "milestone") dbValue = settings.availableMilestones.find(m => m.name === value)?.id ?? value

      const res = await bulkUpdateIssues(targetIds, summary.project.id, { [dbField]: dbValue })
      
      if (!res.success) {
        toast.error(res.error ?? "Failed to update issues")
      } else {
        toast.success(`Updated ${targetIds.length} issues`)
        if (!ids) setSelectedIds(new Set())
        router.refresh()
      }
    } catch (error) {
      console.error(error)
      toast.error("An error occurred during bulk update")
    } finally {
      setIsBulkUpdating(false)
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      const editableIds = filteredIssues
        .filter(issue => canEditIssue(issue))
        .map(issue => issue.id)
      setSelectedIds(new Set(editableIds))
    } else {
      setSelectedIds(new Set())
    }
  }

  const toggleSelectIssue = (id: string, checked: boolean) => {
    const issue = issues.find(i => i.id === id)
    if (checked && issue && !canEditIssue(issue)) return
    
    const next = new Set(selectedIds)
    if (checked) {
      next.add(id)
    } else {
      next.delete(id)
    }
    setSelectedIds(next)
  }

  const filteredIssues = React.useMemo(() => {
    let nextIssues = [...issues]

    // Filters
    if (statusFilter !== "All") nextIssues = nextIssues.filter(i => i.status === statusFilter)
    if (disciplineFilter !== "All") nextIssues = nextIssues.filter(i => i.discipline === disciplineFilter)
    if (importanceFilter !== "All") nextIssues = nextIssues.filter(i => i.importance === importanceFilter)
    if (stateFilter !== "All") nextIssues = nextIssues.filter(i => i.state === stateFilter)
    if (classificationFilter !== "All") nextIssues = nextIssues.filter(i => i.classification === classificationFilter)
    if (milestoneFilter !== "All") nextIssues = nextIssues.filter(i => i.milestone === milestoneFilter)

    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase()
      nextIssues = nextIssues.filter((issue) =>
        issue.issueNumber.toLowerCase().includes(query) ||
        issue.discipline.toLowerCase().includes(query) ||
        issue.importance.toLowerCase().includes(query) ||
        issue.status.toLowerCase().includes(query) ||
        issue.authorName.toLowerCase().includes(query) ||
        issue.reviewName.toLowerCase().includes(query) ||
        (issue.reviewSpecificStatus?.toLowerCase().includes(query) ?? false) ||
        (issue.state?.toLowerCase().includes(query) ?? false) ||
        (issue.classification?.toLowerCase().includes(query) ?? false) ||
        (issue.milestone?.toLowerCase().includes(query) ?? false)
      )
    }

    // Sort
    nextIssues.sort((a, b) => {
      const aValue = a[sortKey] ?? ""
      const bValue = b[sortKey] ?? ""
      
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(aValue)
      }
      
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortOrder === "asc" ? aValue - bValue : bValue - aValue
      }
      
      return 0
    })

    return nextIssues
  }, [issues, searchTerm, statusFilter, disciplineFilter, importanceFilter, stateFilter, classificationFilter, milestoneFilter, sortKey, sortOrder])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle>Issues</CardTitle>
          <CardDescription>Monitor open items and track response health</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {/* ─── View-mode toggle ─── */}
          <div className="flex items-center rounded-md border bg-muted p-0.5">
            <button
              type="button"
              aria-label="Table view"
              onClick={() => setViewMode("table")}
              className={cn(
                "inline-flex items-center justify-center rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
                viewMode === "table"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Table2 className="size-4" />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => setViewMode("grid")}
              className={cn(
                "inline-flex items-center justify-center rounded-sm px-2 py-1.5 text-xs font-medium transition-colors",
                viewMode === "grid"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGrid className="size-4" />
            </button>
          </div>
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 mr-2 animate-in fade-in slide-in-from-right-4 duration-300">
               <Badge variant="secondary" className="h-8 px-3 text-xs font-bold bg-primary text-primary-foreground border-none">
                 {selectedIds.size} Selected
               </Badge>
               <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setSelectedIds(new Set())}
               >
                 Clear
               </Button>
            </div>
          )}
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
                Filters
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Filter issues</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <div className="p-2 space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</p>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All statuses</SelectItem>
                      {summary.settings.statuses.map(s => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Discipline</p>
                  <Select value={disciplineFilter} onValueChange={setDisciplineFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Disciplines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All disciplines</SelectItem>
                      {summary.settings.disciplines.map(d => (
                        <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Importance</p>
                  <Select value={importanceFilter} onValueChange={setImportanceFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All Importances" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All importances</SelectItem>
                      {summary.settings.importances.map(i => (
                        <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">State</p>
                  <Select value={stateFilter} onValueChange={setStateFilter}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="All States" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All states</SelectItem>
                      {summary.settings.states.map(s => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {viewMode === "grid" ? (
          <IssuesGlideGrid 
            issues={filteredIssues} 
            onUpdate={handleUpdate}
            onBulkUpdate={handleBulkUpdate}
            canEditIssue={canEditIssue}
            settings={summary.settings}
          />
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                {selectedIds.size > 0 && (
                  <TableRow className="bg-primary/5 border-b border-primary/20">
                    <TableHead className="w-10 px-4"></TableHead>
                    <TableHead className="w-[120px]">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-primary uppercase">
                         Bulk Edit
                      </div>
                    </TableHead>
                    <TableHead className="min-w-[120px] px-2 py-1.5"></TableHead>
                    <TableHead className="min-w-[120px] px-2 py-1.5"></TableHead>
                    <TableHead className="min-w-[140px] px-2 py-1.5">
                      <Select disabled={isBulkUpdating} onValueChange={(v) => handleBulkUpdate("discipline", v)}>
                        <SelectTrigger className="h-8 w-full bg-white border-primary/30 text-primary text-[10px] font-bold focus:ring-primary/20">
                          <SelectValue placeholder="SET DISCIPLINE" />
                        </SelectTrigger>
                        <SelectContent>
                          {summary.settings.disciplines.map(d => (
                            <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="min-w-[100px] px-2 py-1.5">
                      <Select disabled={isBulkUpdating} onValueChange={(v) => handleBulkUpdate("importance", v)}>
                        <SelectTrigger className="h-8 w-full bg-white border-primary/30 text-primary text-[10px] font-bold focus:ring-primary/20">
                          <SelectValue placeholder="SET IMPORTANCE" />
                        </SelectTrigger>
                        <SelectContent>
                          {summary.settings.importances.map(i => (
                            <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="min-w-[100px] px-2 py-1.5">
                      <Select disabled={isBulkUpdating} onValueChange={(v) => handleBulkUpdate("status", v)}>
                        <SelectTrigger className="h-8 w-full bg-white border-primary/30 text-primary text-[10px] font-bold focus:ring-primary/20">
                          <SelectValue placeholder="SET STATUS" />
                        </SelectTrigger>
                        <SelectContent>
                          {summary.settings.statuses.map(s => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="min-w-[100px] px-2 py-1.5">
                      <Select disabled={isBulkUpdating} onValueChange={(v) => handleBulkUpdate("state", v)}>
                        <SelectTrigger className="h-8 w-full bg-white border-primary/30 text-primary text-[10px] font-bold focus:ring-primary/20">
                          <SelectValue placeholder="SET STATE" />
                        </SelectTrigger>
                        <SelectContent>
                          {summary.settings.states.map(s => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="min-w-[120px] px-2 py-1.5">
                      <Select disabled={isBulkUpdating} onValueChange={(v) => handleBulkUpdate("classification", v)}>
                        <SelectTrigger className="h-8 w-full bg-white border-primary/30 text-primary text-[10px] font-bold focus:ring-primary/20">
                          <SelectValue placeholder="SET CLASS" />
                        </SelectTrigger>
                        <SelectContent>
                          {summary.settings.classifications.map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="min-w-[120px] px-2 py-1.5">
                      <Select disabled={isBulkUpdating} onValueChange={(v) => handleBulkUpdate("milestone", v)}>
                        <SelectTrigger className="h-8 w-full bg-white border-primary/30 text-primary text-[10px] font-bold focus:ring-primary/20">
                          <SelectValue placeholder="SET MILESTONE" />
                        </SelectTrigger>
                        <SelectContent>
                          {summary.settings.availableMilestones.map(m => (
                            <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="min-w-[120px]">
                      {isBulkUpdating && <Loader2 className="size-4 animate-spin text-primary" />}
                    </TableHead>
                    <TableHead className="min-w-[80px]"></TableHead>
                  </TableRow>
                )}
                <TableRow className="bg-muted/50">
                  <TableHead className="w-10 px-4">
                    <Checkbox 
                      checked={selectedIds.size === filteredIssues.length && filteredIssues.length > 0}
                      onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="w-[120px] cursor-pointer hover:text-foreground" onClick={() => handleSort("issueNumber")}>
                    <div className="flex items-center gap-1">Issue <ArrowUpDown className="size-3" /></div>
                  </TableHead>
                  <TableHead className="min-w-[120px] cursor-pointer hover:text-foreground" onClick={() => handleSort("reviewName")}>
                    <div className="flex items-center gap-1">Review <ArrowUpDown className="size-3" /></div>
                  </TableHead>
                  <TableHead className="min-w-[120px] cursor-pointer hover:text-foreground" onClick={() => handleSort("reviewSpecificStatus")}>
                    <div className="flex items-center gap-1">Review Status <ArrowUpDown className="size-3" /></div>
                  </TableHead>
                  <TableHead className="min-w-[140px] cursor-pointer hover:text-foreground" onClick={() => handleSort("discipline")}>
                    <div className="flex items-center gap-1">Discipline <ArrowUpDown className="size-3" /></div>
                  </TableHead>
                  <TableHead className="min-w-[100px] cursor-pointer hover:text-foreground" onClick={() => handleSort("importance")}>
                    <div className="flex items-center gap-1">Importance <ArrowUpDown className="size-3" /></div>
                  </TableHead>
                  <TableHead className="min-w-[100px] cursor-pointer hover:text-foreground" onClick={() => handleSort("status")}>
                    <div className="flex items-center gap-1">Status <ArrowUpDown className="size-3" /></div>
                  </TableHead>
                  <TableHead className="min-w-[100px] cursor-pointer hover:text-foreground" onClick={() => handleSort("state")}>
                    <div className="flex items-center gap-1">State <ArrowUpDown className="size-3" /></div>
                  </TableHead>
                  <TableHead className="min-w-[120px] cursor-pointer hover:text-foreground" onClick={() => handleSort("classification")}>
                    <div className="flex items-center gap-1">Classification <ArrowUpDown className="size-3" /></div>
                  </TableHead>
                  <TableHead className="min-w-[120px] cursor-pointer hover:text-foreground" onClick={() => handleSort("milestone")}>
                    <div className="flex items-center gap-1">Milestone <ArrowUpDown className="size-3" /></div>
                  </TableHead>
                  <TableHead className="min-w-[120px] cursor-pointer hover:text-foreground" onClick={() => handleSort("authorName")}>
                    <div className="flex items-center gap-1">Author <ArrowUpDown className="size-3" /></div>
                  </TableHead>
                  <TableHead className="min-w-[80px] text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("ageDays")}>
                    <div className="flex items-center justify-end gap-1">Age <ArrowUpDown className="size-3" /></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIssues.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-muted-foreground text-center py-10">
                      No issues match the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredIssues.map((issue) => (
                    <TableRow 
                      key={issue.id} 
                      className={cn(
                        "group hover:bg-muted/30 transition-colors",
                        selectedIds.has(issue.id) && "bg-primary/5 hover:bg-primary/10"
                      )}
                    >
                      <TableCell className="w-10 px-4 py-2">
                         <Checkbox 
                          checked={selectedIds.has(issue.id)}
                          onCheckedChange={(checked) => toggleSelectIssue(issue.id, !!checked)}
                          disabled={!canEditIssue(issue)}
                          aria-label={`Select issue ${issue.issueNumber}`}
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="flex items-center gap-3">
                          {issue.snapshotPath && (
                            <Dialog>
                              <DialogTrigger asChild>
                                <div className="size-10 rounded border bg-muted shrink-0 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity">
                                  <img
                                    src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/issue-snapshots/${issue.snapshotPath}`}
                                    alt="Issue snapshot"
                                    className="size-full object-cover"
                                  />
                                </div>
                              </DialogTrigger>
                              <DialogContent className="max-w-[800px] border-none p-0 bg-transparent shadow-none">
                                <img
                                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/issue-snapshots/${issue.snapshotPath}`}
                                  alt="Issue snapshot full size"
                                  className="w-full h-auto rounded-lg shadow-2xl ring-1 ring-white/10"
                                />
                              </DialogContent>
                            </Dialog>
                          )}
                          <div className="space-y-0.5">
                            <Link 
                              href={`/reviews/${issue.reviewSlug}/documents/${issue.documentId}?page=${issue.pageNumber}&annotationId=${issue.id}`}
                              className="font-semibold text-sm text-primary hover:underline leading-none inline-block pb-0.5"
                            >
                              {issue.issueNumber}
                            </Link>
                            <p className="text-muted-foreground text-[10px] leading-tight">
                              {updatedDateFormatter.format(new Date(issue.dateModified))}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-2">
                        <Link 
                          href={`/${issue.projectSlug}/${issue.reviewSlug}`}
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          {issue.reviewName}
                        </Link>
                      </TableCell>

                      <TableCell className="py-2">
                        {issue.reviewSpecificStatus ? (
                          <Badge variant="outline" className="text-[10px] font-normal py-0 px-2 h-5">
                            {issue.reviewSpecificStatus}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="py-2">
                        {canEditIssue(issue) ? (
                          <Select 
                            disabled={updatingId === issue.id}
                            value={issue.discipline} 
                            onValueChange={(v) => handleUpdate(issue.id, "discipline", v)}
                          >
                            <SelectTrigger className="h-8 border-transparent group-hover:border-input bg-transparent hover:bg-background transition-colors text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {summary.settings.disciplines.map(d => (
                                <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs px-3">{issue.discipline}</span>
                        )}
                      </TableCell>

                      <TableCell className="py-2">
                        {canEditIssue(issue) ? (
                          <Select 
                            disabled={updatingId === issue.id}
                            value={issue.importance} 
                            onValueChange={(v) => handleUpdate(issue.id, "importance", v)}
                          >
                            <SelectTrigger className={cn(
                              "h-8 border-transparent group-hover:border-input bg-transparent hover:bg-background transition-colors text-xs font-medium",
                              importanceTone[issue.importance]
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {summary.settings.importances.map(i => (
                                <SelectItem key={i.id} value={i.name}>{i.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={cn("text-[10px] font-medium py-0 px-2 h-6 border-none", importanceTone[issue.importance])}>
                            {issue.importance}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="py-2">
                        {canEditIssue(issue) ? (
                          <Select 
                            disabled={updatingId === issue.id}
                            value={issue.status} 
                            onValueChange={(v) => handleUpdate(issue.id, "status", v)}
                          >
                            <SelectTrigger className={cn(
                              "h-8 border-transparent group-hover:border-input bg-transparent hover:bg-background transition-colors text-xs font-semibold",
                              statusTone[issue.status as keyof typeof statusTone] ?? "bg-muted text-muted-foreground"
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {summary.settings.statuses.map(s => (
                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="outline" className={cn("text-[10px] font-medium py-0 px-2 h-6 border-none", statusTone[issue.status as keyof typeof statusTone] ?? "bg-muted text-muted-foreground")}>
                            {issue.status}
                          </Badge>
                        )}
                      </TableCell>

                      <TableCell className="py-2">
                        {canEditIssue(issue) ? (
                          <Select 
                            disabled={updatingId === issue.id}
                            value={issue.state ?? ""} 
                            onValueChange={(v) => handleUpdate(issue.id, "state", v)}
                          >
                            <SelectTrigger className="h-8 border-transparent group-hover:border-input bg-transparent hover:bg-background transition-colors text-xs">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              {summary.settings.states.map(s => (
                                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs px-3">{issue.state || "—"}</span>
                        )}
                      </TableCell>

                      <TableCell className="py-2">
                        {canEditIssue(issue) ? (
                          <Select 
                            disabled={updatingId === issue.id}
                            value={issue.classification ?? ""} 
                            onValueChange={(v) => handleUpdate(issue.id, "classification", v)}
                          >
                            <SelectTrigger className="h-8 border-transparent group-hover:border-input bg-transparent hover:bg-background transition-colors text-xs">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              {summary.settings.classifications.map(c => (
                                <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs px-3">{issue.classification || "—"}</span>
                        )}
                      </TableCell>

                      <TableCell className="py-2">
                        {canEditIssue(issue) ? (
                          <Select 
                            disabled={updatingId === issue.id}
                            value={issue.milestone ?? ""} 
                            onValueChange={(v) => handleUpdate(issue.id, "milestone", v)}
                          >
                            <SelectTrigger className="h-8 border-transparent group-hover:border-input bg-transparent hover:bg-background transition-colors text-xs">
                              <SelectValue placeholder="-" />
                            </SelectTrigger>
                            <SelectContent>
                              {summary.settings.availableMilestones.map(m => (
                                <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="text-xs px-3">{issue.milestone || "—"}</span>
                        )}
                      </TableCell>

                      <TableCell className="py-2">
                        <span className="text-xs text-muted-foreground px-3">{issue.authorName}</span>
                      </TableCell>

                      <TableCell className="py-2 text-right">
                        <div className="space-y-0.5 px-2">
                          <p className="font-medium text-xs">{issue.ageDays}d</p>
                          {issue.isLongOpen && (
                            <p className="text-[9px] text-destructive font-bold uppercase tracking-tighter">Late</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

