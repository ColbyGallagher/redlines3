"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowUpRight, Filter, Search, X, ChevronUp, ChevronDown, List, LayoutGrid, Calendar, CalendarClock, Clock } from "lucide-react"
import { toast } from "sonner"

import { updateReviewLifecycle } from "@/lib/actions/reviews"
import { CreateReviewDialog } from "@/components/projects/create-review-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { ProjectReviewSummary, Milestone, ProjectSummary } from "@/lib/data/projects"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

function formatDate(date: string | null | undefined) {
  if (!date) return "N/A"
  return new Date(date).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function formatReviewStatus(review: ProjectReviewSummary) {
  if (review.isOverdue) {
    return "Overdue"
  }
  if (review.isUpcoming) {
    return "Upcoming"
  }
  return review.status
}

const DUE_TYPE_LABELS: Record<string, string> = {
  client: "Client SME comments",
  consultant: "Consultant issue comments",
  reply: "Client issue replies",
}

function formatDueLabel(review: ProjectReviewSummary) {
  const { dueDate, daysUntilDue, dueDateType } = review
  if (!dueDate || !dueDateType) {
    return "No due date"
  }

  const responseLabel = DUE_TYPE_LABELS[dueDateType] ?? "Response"

  if (review.isOverdue && typeof daysUntilDue === "number") {
    const days = Math.abs(daysUntilDue)
    return `${days === 0 ? "Due" : `${days} day${days === 1 ? "" : "s"}`} overdue · ${responseLabel}`
  }

  if (typeof daysUntilDue === "number") {
    if (daysUntilDue === 0) {
      return `Due today · ${responseLabel}`
    }
    return `Due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"} · ${responseLabel}`
  }

  return responseLabel
}

type ProjectReviewsListProps = {
  summary: ProjectSummary
  isAdmin?: boolean
}

export function ProjectReviewsList({ summary, isAdmin }: ProjectReviewsListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<{
    reviewId: string;
    field: "state" | "status" | "specificStatus" | "phaseId" | "milestone" | "dueDate";
    value: string;
    reviewName: string;
  } | null>(null)
  const [stateFilter, setStateFilter] = useState<string>("Active")
  const [view, setView] = useState<'table' | 'kanban' | 'timeline'>('table')

  // Advanced Table State
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "name",
    "milestone",
    "phase",
    "state",
    "overdue",
    "issues",
    "reviewers",
    "notStarted",
    "documents",
    "dueDate",
  ])
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" | null }>({
    key: null,
    direction: null,
  })
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

  const allReviews = useMemo(() => {
    return [...summary.reviews]
  }, [summary.reviews])

  const filteredAndSortedReviews = useMemo(() => {
    let reviews = allReviews.filter((review: ProjectReviewSummary) => {
      if (stateFilter === "All") return true
      return (review.state || "Active").toLowerCase() === stateFilter.toLowerCase()
    })

    // Apply column filters
    if (Object.keys(columnFilters).length > 0) {
      reviews = reviews.filter((review: ProjectReviewSummary) => {
        return Object.entries(columnFilters).every(([key, filterValue]) => {
          let val = ""
          if (key === "reviewers") val = `${review.reviewerStats.complete} / ${review.reviewerStats.total - review.reviewerStats.complete}`
          else if (key === "notStarted") val = String(review.reviewerStats.notStarted)
          else if (key === "issues") val = String(review.issueCount)
          else if (key === "documents") val = String(review.documentCount)
          else if (key === "phase") val = summary.settings.phases.find(p => p.id === review.phaseId)?.phase_name || review.specificStatus || "In Progress"
          else if (key === "overdue") val = review.isOverdue ? "Overdue" : review.isUpcoming ? "Upcoming" : "On Track"
          else val = String((review as any)[key] || "")
          
          return val.toLowerCase().includes(filterValue.toLowerCase())
        })
      })
    }

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      const { key, direction } = sortConfig
      reviews.sort((a: ProjectReviewSummary, b: ProjectReviewSummary) => {
        let valA: any, valB: any
        if (key === "reviewers") {
          valA = a.reviewerStats.complete
          valB = b.reviewerStats.complete
        } else if (key === "notStarted") {
          valA = a.reviewerStats.notStarted
          valB = b.reviewerStats.notStarted
        } else if (key === "issues") {
          valA = a.issueCount
          valB = b.issueCount
        } else if (key === "documents") {
          valA = a.documentCount
          valB = b.documentCount
        } else if (key === "phase") {
          valA = summary.settings.phases.find(p => p.id === a.phaseId)?.phase_name || a.specificStatus || "In Progress"
          valB = summary.settings.phases.find(p => p.id === b.phaseId)?.phase_name || b.specificStatus || "In Progress"
        } else if (key === "overdue") {
          valA = a.isOverdue ? 2 : a.isUpcoming ? 1 : 0
          valB = b.isOverdue ? 2 : b.isUpcoming ? 1 : 0
        } else {
          valA = String((a as any)[key] || "").toLowerCase()
          valB = String((b as any)[key] || "").toLowerCase()
        }

        if (valA < valB) return direction === "asc" ? -1 : 1
        if (valA > valB) return direction === "asc" ? 1 : -1
        return 0
      })
    } else {
      reviews.sort((a: ProjectReviewSummary, b: ProjectReviewSummary) => a.reviewName.localeCompare(b.reviewName))
    }

    return reviews
  }, [allReviews, stateFilter, columnFilters, sortConfig])

  const handleUpdate = (reviewId: string, field: "state" | "status" | "specificStatus" | "phaseId" | "milestone" | "dueDate", value: string, reviewName: string, skipConfirm = false) => {
    if (skipConfirm) {
      executeUpdateInline(reviewId, field, value)
    } else {
      setPendingUpdate({ reviewId, field, value, reviewName })
      setConfirmOpen(true)
    }
  }

  const executeUpdateInline = (reviewId: string, field: "state" | "status" | "specificStatus" | "phaseId" | "milestone" | "dueDate", value: string) => {
    startTransition(async () => {
      const result = await updateReviewLifecycle(reviewId, summary.project.id, {
        [field]: value,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    })
  }

  const executeUpdate = () => {
    if (!pendingUpdate) return

    startTransition(async () => {
      const result = await updateReviewLifecycle(pendingUpdate.reviewId, summary.project.id, {
        [pendingUpdate.field]: pendingUpdate.value,
      })
      if (result.success) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
      setConfirmOpen(false)
      setPendingUpdate(null)
    })
  }

  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId)
    e.dataTransfer.setData("columnId", columnId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault()
    const sourceColumnId = e.dataTransfer.getData("columnId")
    if (sourceColumnId === targetColumnId) {
      setDraggedColumn(null)
      setDragOverColumn(null)
      return
    }

    const newOrder = [...columnOrder]
    const sourceIndex = newOrder.indexOf(sourceColumnId)
    const targetIndex = newOrder.indexOf(targetColumnId)

    newOrder.splice(sourceIndex, 1)
    newOrder.splice(targetIndex, 0, sourceColumnId)

    setColumnOrder(newOrder)
    setDraggedColumn(null)
    setDragOverColumn(null)
  }

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    } else if (sortConfig.key === key && sortConfig.direction === "desc") {
      direction = null
    }

    setSortConfig({ key: direction ? key : null, direction })
  }

  const handleFilterChange = (columnId: string, value: string) => {
    setColumnFilters((prev) => {
      const newFilters = { ...prev }
      if (value) {
        newFilters[columnId] = value
      } else {
        delete newFilters[columnId]
      }
      return newFilters
    })
  }

  const getUniqueValues = (columnId: string) => {
    const values = new Set<string>()
    allReviews.forEach((review: ProjectReviewSummary) => {
      let val = ""
      if (columnId === "reviewers") val = `${review.reviewerStats.complete} / ${review.reviewerStats.total - review.reviewerStats.complete}`
      else if (columnId === "notStarted") val = String(review.reviewerStats.notStarted)
      else if (columnId === "issues") val = String(review.issueCount)
      else if (columnId === "documents") val = String(review.documentCount)
      else val = String((review as any)[columnId] || "")
      
      if (val !== "") values.add(val)
    })
    return Array.from(values).sort()
  }

  const milestones = summary.settings.availableMilestones.map((m: Milestone) => m.name)

  const columns = useMemo(() => [
    { id: "name", label: "Review Name" },
    { id: "milestone", label: "Milestone" },
    { id: "phase", label: "Phase" },
    { id: "state", label: "State" },
    { id: "overdue", label: "Status" },
    { id: "issues", label: "Issues" },
    { id: "reviewers", label: "Reviewers (Comp/Not)" },
    { id: "notStarted", label: "Not Started" },
    { id: "documents", label: "Docs" },
    { id: "dueDate", label: "Due Date" },
  ], [])

  const sortedColumns = useMemo(() => {
    return columnOrder.map(id => columns.find(col => col.id === id)!)
  }, [columnOrder, columns])

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="space-y-1">
            <CardTitle>Project Reviews</CardTitle>
            <CardDescription>Track key milestones and upcoming checkpoints</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Tabs value={stateFilter} onValueChange={setStateFilter} className="w-auto">
              <TabsList>
                <TabsTrigger value="Active">Active</TabsTrigger>
                <TabsTrigger value="Complete">Complete</TabsTrigger>
                <TabsTrigger value="Archived">Archived</TabsTrigger>
                <TabsTrigger value="All">All</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Tabs value={view} onValueChange={(v) => setView(v as 'table' | 'kanban' | 'timeline')} className="w-auto">
              <TabsList className="grid w-[150px] grid-cols-3">
                <TabsTrigger value="table" title="Table View">
                  <List className="size-4" />
                </TabsTrigger>
                <TabsTrigger value="kanban" title="Kanban View">
                  <LayoutGrid className="size-4" />
                </TabsTrigger>
                <TabsTrigger value="timeline" title="Timeline View">
                  <CalendarClock className="size-4" />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              {isAdmin && <CreateReviewDialog projectId={summary.project.id} projectSlug={summary.project.slug || summary.project.id} milestones={milestones} />}
              <Button variant="ghost" size="sm">
                View all
                <ArrowUpRight className="ml-1 size-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredAndSortedReviews.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4">No reviews logged for this project.</p>
          ) : view === 'table' ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {sortedColumns.map((column) => (
                      <TableHead 
                        key={column.id}
                        className={cn(
                          "relative group transition-colors select-none",
                          draggedColumn === column.id && "opacity-30",
                          dragOverColumn === column.id && "bg-primary/5 border-r-2 border-r-primary",
                          ["issues", "reviewers", "notStarted", "documents", "state", "overdue"].includes(column.id) && "text-center"
                        )}
                        draggable
                        onDragStart={(e: React.DragEvent) => handleDragStart(e, column.id)}
                        onDragOver={(e: React.DragEvent) => handleDragOver(e, column.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e: React.DragEvent) => handleDrop(e, column.id)}
                      >
                        <div className="flex items-center gap-1.5 min-h-[32px]">
                          <span 
                            className="cursor-pointer hover:text-primary transition-colors flex items-center gap-1 font-semibold"
                            onClick={() => handleSort(column.id)}
                          >
                            {column.label}
                            {sortConfig.key === column.id && (
                              sortConfig.direction === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
                            )}
                          </span>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-6 h-6 w-6 p-0 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity">
                                <Filter className={cn("size-3", columnFilters[column.id] ? "text-primary fill-primary/10" : "text-muted-foreground")} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                              <DropdownMenuLabel className="text-xs">Filter {column.label}</DropdownMenuLabel>
                              <div className="p-2">
                                <div className="relative">
                                  <Search className="absolute left-2 top-2.5 size-3 text-muted-foreground" />
                                  <Input 
                                    placeholder="Search..." 
                                    className="h-8 pl-7 text-xs"
                                    value={columnFilters[column.id] || ""}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFilterChange(column.id, e.target.value)}
                                  />
                                  {columnFilters[column.id] && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="absolute right-0 top-0 size-8 h-8 w-8 p-0"
                                      onClick={() => handleFilterChange(column.id, "")}
                                    >
                                      <X className="size-3" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                              <DropdownMenuSeparator />
                              <div className="max-h-40 overflow-y-auto">
                                {getUniqueValues(column.id).map((val) => (
                                  <DropdownMenuItem 
                                    key={val} 
                                    className="text-xs"
                                    onClick={() => handleFilterChange(column.id, val)}
                                  >
                                    {val}
                                  </DropdownMenuItem>
                                ))}
                              </div>
                              {columnFilters[column.id] && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-xs text-destructive focus:text-destructive"
                                    onClick={() => handleFilterChange(column.id, "")}
                                  >
                                    Clear filter
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedReviews.map((review: ProjectReviewSummary) => (
                    <TableRow key={review.id} className="group/row">
                      {columnOrder.map((columnId) => {
                        switch (columnId) {
                          case "name":
                            return (
                              <TableCell key={columnId}>
                                <Link
                                  href={`/${summary.project.slug || summary.project.id}/${review.slug}`}
                                  className="font-medium hover:text-primary transition-colors block"
                                >
                                  {review.reviewName}
                                </Link>
                              </TableCell>
                            )
                          case "milestone":
                            return (
                              <TableCell key={columnId}>
                                {isAdmin ? (
                                  <Select
                                    disabled={isPending}
                                    value={review.milestone}
                                    onValueChange={(v) => handleUpdate(review.id, "milestone", v, review.reviewName, true)}
                                  >
                                    <SelectTrigger className="h-7 text-xs border-transparent hover:border-input bg-transparent hover:bg-muted/50 transition-all w-full min-w-[120px]">
                                      <SelectValue placeholder="Milestone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {/* Ensure the current milestone is shown even if not in the default project list */}
                                      {!milestones.includes(review.milestone) && review.milestone !== "Unspecified" && (
                                        <SelectItem key={review.milestone} value={review.milestone}>{review.milestone}</SelectItem>
                                      )}
                                      {review.milestone === "Unspecified" && !milestones.includes("Unspecified") && (
                                        <SelectItem value="Unspecified">Unspecified</SelectItem>
                                      )}
                                      {milestones.map(m => (
                                        <SelectItem key={m} value={m}>{m}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-xs text-muted-foreground">{review.milestone}</span>
                                )}
                              </TableCell>
                            )
                           case "phase":
                            return (
                              <TableCell key={columnId}>
                                {isAdmin ? (
                                  <Select
                                    disabled={isPending}
                                    value={review.phaseId || review.specificStatus || "In Progress"}
                                    onValueChange={(v) => {
                                      if (v.includes("-")) {
                                        handleUpdate(review.id, "phaseId", v, review.reviewName, true)
                                      } else {
                                        handleUpdate(review.id, "specificStatus", v, review.reviewName, true)
                                      }
                                    }}
                                  >
                                    <SelectTrigger className="h-7 text-[10px] w-full border-transparent hover:border-input bg-transparent hover:bg-muted/50 min-w-[120px]">
                                      <SelectValue placeholder="Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {summary.settings.phases && summary.settings.phases.length > 0 ? (
                                        summary.settings.phases.map((phase) => (
                                          <SelectItem key={phase.id} value={phase.id}>
                                            {phase.phase_name}
                                          </SelectItem>
                                        ))
                                      ) : (
                                        <>
                                          <SelectItem value="In Progress">In Progress</SelectItem>
                                          <SelectItem value="Awaiting Design Review">Awaiting Design Review</SelectItem>
                                          <SelectItem value="Awaiting Client Review">Awaiting Client Review</SelectItem>
                                          <SelectItem value="Resolved">Resolved</SelectItem>
                                          <SelectItem value="Closed">Closed</SelectItem>
                                        </>
                                      )}
                                    </SelectContent>
                                  </Select>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground px-2">
                                    {summary.settings.phases.find(p => p.id === review.phaseId)?.phase_name || review.specificStatus || "In Progress"}
                                  </span>
                                )}
                              </TableCell>
                            )
                          case "state":
                            return (
                              <TableCell key={columnId} className="text-center">
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px] h-5 py-0 font-medium",
                                    (review.state || "Active") === "Active" && "text-green-600 border-green-600/30 bg-green-50",
                                    (review.state || "Active") === "Complete" && "text-blue-600 border-blue-600/30 bg-blue-50",
                                    (review.state || "Active") === "Archived" && "text-muted-foreground border-muted-foreground/30 bg-muted"
                                  )}
                                >
                                  {review.state || "Active"}
                                </Badge>
                              </TableCell>
                            )
                          case "overdue":
                            return (
                              <TableCell key={columnId} className="text-center">
                                <Badge 
                                  variant="secondary" 
                                  className={cn(
                                    "text-[10px] h-5 py-0 whitespace-nowrap",
                                    review.isOverdue && "text-destructive border-destructive/30 bg-destructive/5"
                                  )}
                                >
                                  {review.isOverdue ? "Overdue" : review.isUpcoming ? "Upcoming" : "On Track"}
                                </Badge>
                              </TableCell>
                            )
                          case "issues":
                            return (
                              <TableCell key={columnId} className="text-center font-medium">
                                {review.issueCount}
                              </TableCell>
                            )
                          case "reviewers":
                            return (
                              <TableCell key={columnId} className="text-center text-xs">
                                <span className="text-green-600 font-semibold">{review.reviewerStats.complete}</span>
                                <span className="text-muted-foreground mx-1">/</span>
                                <span className="text-orange-600 font-semibold">{review.reviewerStats.total - review.reviewerStats.complete}</span>
                              </TableCell>
                            )
                          case "notStarted":
                            return (
                              <TableCell key={columnId} className="text-center text-xs font-medium">
                                {review.reviewerStats.notStarted}
                              </TableCell>
                            )
                          case "documents":
                            return (
                              <TableCell key={columnId} className="text-center font-medium">
                                {review.documentCount}
                              </TableCell>
                            )
                          case "dueDate":
                            return (
                              <TableCell key={columnId}>
                                <div className="flex flex-col gap-0.5 min-w-[120px]">
                                  {isAdmin ? (
                                    <div className="relative group/date">
                                      <input 
                                        type="date"
                                        className={cn(
                                          "h-7 text-xs p-1 rounded border-transparent hover:border-input bg-transparent hover:bg-muted/50 w-full focus:outline-none focus:ring-1 focus:ring-primary",
                                          review.isOverdue && "text-destructive font-semibold"
                                        )}
                                        value={review.dueDate ? review.dueDate.split('T')[0] : ""}
                                        onChange={(e) => handleUpdate(review.id, "dueDate", e.target.value, review.reviewName, true)}
                                      />
                                    </div>
                                  ) : (
                                    <p className={cn(
                                      "text-xs font-medium",
                                      review.isOverdue ? "text-destructive" : "text-muted-foreground"
                                    )}>
                                      {formatDate(review.dueDate)}
                                    </p>
                                  )}
                                  <p className="text-[10px] text-muted-foreground italic">
                                    {formatDueLabel(review)}
                                  </p>
                                </div>
                              </TableCell>
                            )
                          default:
                            return null
                        }
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : view === 'kanban' ? (
            <KanbanBoard 
              reviews={filteredAndSortedReviews} 
              phases={summary.settings.phases || []}
              projectId={summary.project.id}
              projectSlug={summary.project.slug || summary.project.id}
              isAdmin={isAdmin}
              isPending={isPending}
              onUpdate={handleUpdate}
            />
          ) : (
            <TimelineView reviews={filteredAndSortedReviews} projectSlug={summary.project.slug || summary.project.id} />
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to update the <strong>{pendingUpdate?.field}</strong> for <strong>{pendingUpdate?.reviewName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={() => pendingUpdate && executeUpdateInline(pendingUpdate.reviewId, pendingUpdate.field, pendingUpdate.value)}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function KanbanBoard({ 
  reviews, 
  phases, 
  projectId, 
  isAdmin, 
  isPending,
  onUpdate,
  projectSlug
}: { 
  reviews: ProjectReviewSummary[], 
  phases: any[], 
  projectId: string,
  isAdmin?: boolean,
  isPending: boolean,
  onUpdate: (reviewId: string, field: any, value: string, reviewName: string, skipConfirm?: boolean) => void,
  projectSlug: string
}) {
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const columns = phases.length > 0 
    ? phases.map(p => ({ id: p.id, name: p.phase_name || (p as any).name }))
    : [
        { id: "In Progress", name: "In Progress" },
        { id: "Awaiting Design Review", name: "Awaiting Design Review" },
        { id: "Awaiting Client Review", name: "Awaiting Client Review" },
        { id: "Resolved", name: "Resolved" },
        { id: "Closed", name: "Closed" }
      ];

  const groupedReviews = useMemo(() => {
    const groups: Record<string, ProjectReviewSummary[]> = {};
    columns.forEach(col => groups[col.id] = []);
    
    reviews.forEach(review => {
      const key = review.phaseId || review.specificStatus || "In Progress";
      if (!groups[key]) groups[key] = [];
      groups[key].push(review);
    });
    
    return groups;
  }, [reviews, columns]);

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    if (!isAdmin || isPending) return;
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    if (!isAdmin || isPending) return;
    e.preventDefault();
    setDragOverColumn(null);
    const reviewId = e.dataTransfer.getData("reviewId");
    const reviewName = e.dataTransfer.getData("reviewName");
    const sourceColumnId = e.dataTransfer.getData("sourceColumnId");
    
    if (reviewId && reviewName && sourceColumnId !== columnId) {
      onUpdate(reviewId, "phaseId", columnId, reviewName, true);
    }
  };

  return (
    <div className="flex gap-4 pb-4 overflow-x-auto min-h-[500px]">
      {columns.map(column => (
        <div 
          key={column.id} 
          className={cn(
            "flex-shrink-0 w-80 bg-muted/30 rounded-lg p-3 flex flex-col gap-3 transition-colors duration-200",
            dragOverColumn === column.id && "bg-primary/5 ring-2 ring-primary/20 ring-inset"
          )}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={() => setDragOverColumn(null)}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
              {column.name}
              <Badge variant="secondary" className="text-[10px] h-4 min-w-[18px] flex items-center justify-center p-0">
                {groupedReviews[column.id]?.length || 0}
              </Badge>
            </h3>
          </div>
          
          <div className="flex-1 flex flex-col gap-3 min-h-[20px]">
            {groupedReviews[column.id]?.map(review => (
              <KanbanCard 
                key={review.id} 
                review={review} 
                columnId={column.id}
                isAdmin={isAdmin}
                isPending={isPending}
                projectSlug={projectSlug}
              />
            ))}
            {groupedReviews[column.id]?.length === 0 && (
              <div className="flex-1 rounded-md border-2 border-dashed border-muted-foreground/10" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function KanbanCard({ 
  review, 
  columnId,
  isAdmin,
  isPending,
  projectSlug
}: { 
  review: ProjectReviewSummary, 
  columnId: string,
  isAdmin?: boolean,
  isPending: boolean,
  projectSlug: string
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    if (!isAdmin || isPending) return;
    setIsDragging(true);
    e.dataTransfer.setData("reviewId", review.id);
    e.dataTransfer.setData("reviewName", review.reviewName);
    e.dataTransfer.setData("sourceColumnId", columnId);
    e.dataTransfer.effectAllowed = "move";
  };

  return (
    <Card 
      draggable={isAdmin && !isPending}
      onDragStart={handleDragStart}
      onDragEnd={() => setIsDragging(false)}
      className={cn(
        "shadow-sm hover:shadow-md transition-all cursor-pointer group/card border-muted/60 overflow-hidden",
        isDragging && "opacity-50 scale-[0.98] grayscale-[0.2]"
      )}
    >
      <CardHeader className="p-3 pb-1 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground font-mono">
           #{review.id.slice(0, 6).toUpperCase()}
          </span>
          <Badge 
            variant="outline" 
            className={cn(
              "text-[9px] h-4 py-0 font-medium px-1.5",
              (review.state || "Active") === "Active" && "text-green-600 border-green-600/30 bg-green-50",
              (review.state || "Active") === "Complete" && "text-blue-600 border-blue-600/30 bg-blue-50",
              (review.state || "Active") === "Archived" && "text-muted-foreground border-muted-foreground/30 bg-muted"
            )}
          >
            {review.state || "Active"}
          </Badge>
        </div>
        <Link href={`/${projectSlug}/${review.slug}`} className="block">
          <h4 className="text-sm font-bold leading-tight group-hover/card:text-primary transition-colors line-clamp-2">
            {review.reviewName}
          </h4>
        </Link>
      </CardHeader>
      
      <CardContent className="p-3 pt-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Issues</span>
            <span className="text-xs font-medium">{review.issueCount}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Docs</span>
            <span className="text-xs font-medium">{review.documentCount}</span>
          </div>
        </div>
      </CardContent>
      
      <div className="px-3 pb-3 flex items-center justify-between gap-2 border-t border-muted/30 pt-2 bg-muted/5">
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-medium",
          review.isOverdue ? "text-destructive" : review.isUpcoming ? "text-orange-600" : "text-muted-foreground"
        )}>
          <Calendar className="size-3" />
          {review.dueDate ? formatDate(review.dueDate) : "No date"}
        </div>
        
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground font-medium">
            {review.leadReviewer?.name || "Unassigned"}
          </span>
          <Avatar className="size-5 border border-background">
            <AvatarImage src={review.leadReviewer?.avatar_url || ""} />
            <AvatarFallback className="text-[8px] bg-primary/10 text-primary">
              {(review.leadReviewer?.name || "??").split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </Card>
  );
}

function TimelineView({ reviews, projectSlug }: { reviews: ProjectReviewSummary[], projectSlug: string }) {
  const sortedReviews = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }, [reviews]);

  const groups = useMemo(() => {
    const grouped: Record<string, ProjectReviewSummary[]> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    sortedReviews.forEach(review => {
      let groupKey = "Upcoming";
      if (!review.dueDate) {
        groupKey = "No Date";
      } else if (review.isOverdue) {
        groupKey = "Overdue";
      } else {
        const dueDate = new Date(review.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        if (dueDate.getTime() === today.getTime()) {
          groupKey = "Today";
        } else {
          groupKey = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
        }
      }

      if (!grouped[groupKey]) grouped[groupKey] = [];
      grouped[groupKey].push(review);
    });

    return grouped;
  }, [sortedReviews]);

  // Order groups: Overdue, Today, then by date, then No Date
  const groupOrder = useMemo(() => {
    const keys = Object.keys(groups);
    const order = [];
    if (keys.includes("Overdue")) order.push("Overdue");
    if (keys.includes("Today")) order.push("Today");
    
    const dateKeys = keys.filter(k => !["Overdue", "Today", "No Date", "Upcoming"].includes(k))
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    order.push(...dateKeys);
    if (keys.includes("No Date")) order.push("No Date");
    
    return order;
  }, [groups]);

  return (
    <div className="relative pl-8 space-y-8 before:absolute before:inset-0 before:left-[11px] before:h-full before:w-0.5 before:bg-border pb-8 max-w-4xl mx-auto">
      {groupOrder.map(groupKey => (
        <div key={groupKey} className="relative space-y-4">
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm -ml-8 pl-8 py-1">
             <div className="absolute left-[7px] top-1/2 -translate-y-1/2 size-2.5 rounded-full border-2 border-background ring-2 ring-primary bg-primary" />
             <h3 className={cn(
               "text-sm font-bold tracking-tight",
               groupKey === "Overdue" ? "text-destructive" : "text-muted-foreground uppercase"
             )}>
               {groupKey}
             </h3>
          </div>
          
          <div className="grid gap-3">
            {groups[groupKey].map(review => (
              <TimelineCard key={review.id} review={review} projectSlug={projectSlug} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function TimelineCard({ review, projectSlug }: { review: ProjectReviewSummary, projectSlug: string }) {
  return (
    <Card className="hover:shadow-md transition-all border-muted group/card bg-card/50">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <Badge 
            variant="outline" 
            className={cn(
              "text-[9px] h-5 py-0 font-medium px-1.5 shrink-0",
              (review.state || "Active") === "Active" && "text-green-600 border-green-600/30 bg-green-50",
              (review.state || "Active") === "Complete" && "text-blue-600 border-blue-600/30 bg-blue-50",
              (review.state || "Active") === "Archived" && "text-muted-foreground border-muted-foreground/30 bg-muted"
            )}
          >
            {review.state || "Active"}
          </Badge>
          
          <div className="space-y-0.5 overflow-hidden">
            <Link href={`/${projectSlug}/${review.slug}`} className="block">
              <h4 className="text-sm font-bold group-hover/card:text-primary transition-colors truncate">
                {review.reviewName}
              </h4>
            </Link>
            <p className="text-[10px] text-muted-foreground font-mono">#{review.id.slice(0, 6).toUpperCase()}</p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-6">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end whitespace-nowrap">
               <span className="text-[10px] text-muted-foreground font-medium">{review.leadReviewer?.name || "Unassigned"}</span>
               <span className={cn(
                 "text-[10px] flex items-center gap-1 font-semibold",
                 review.isOverdue ? "text-destructive" : "text-muted-foreground"
               )}>
                 <Clock className="size-3" />
                 {review.dueDate ? formatDate(review.dueDate) : "No date"}
               </span>
            </div>
            <Avatar className="size-8 border-2 border-background shadow-sm">
              <AvatarImage src={review.leadReviewer?.avatar_url || ""} />
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {(review.leadReviewer?.name || "??").split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
          </div>
          
          <Link href={`/${projectSlug}/${review.slug}`} className="text-muted-foreground hover:text-primary shrink-0">
            <ArrowUpRight className="size-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
