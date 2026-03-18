"use client"

import { useState, useTransition, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowUpRight, Filter, Search, X, ChevronUp, ChevronDown } from "lucide-react"
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
    field: "state" | "status" | "specificStatus" | "milestone" | "dueDate";
    value: string;
    reviewName: string;
  } | null>(null)
  const [stateFilter, setStateFilter] = useState<string>("Active")

  // Advanced Table State
  const [columnOrder, setColumnOrder] = useState<string[]>([
    "name",
    "milestone",
    "status",
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

  const handleUpdate = (reviewId: string, field: "state" | "status" | "specificStatus" | "milestone" | "dueDate", value: string, reviewName: string, skipConfirm = false) => {
    if (skipConfirm) {
      executeUpdateInline(reviewId, field, value)
    } else {
      setPendingUpdate({ reviewId, field, value, reviewName })
      setConfirmOpen(true)
    }
  }

  const executeUpdateInline = (reviewId: string, field: "state" | "status" | "specificStatus" | "milestone" | "dueDate", value: string) => {
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
    { id: "status", label: "Status" },
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
            <div className="flex items-center gap-2">
              <CreateReviewDialog projectId={summary.project.id} milestones={milestones} />
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
          ) : (
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
                          ["issues", "reviewers", "notStarted", "documents"].includes(column.id) && "text-center"
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
                                  href={`/reviews/${review.id}`}
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
                          case "status":
                            return (
                              <TableCell key={columnId}>
                                <div className="flex flex-col gap-1.5 min-w-[140px]">
                                  <div className="flex items-center gap-2">
                                    {isAdmin ? (
                                      <Select
                                        disabled={isPending}
                                        value={review.state || "Active"}
                                        onValueChange={(v) => handleUpdate(review.id, "state", v, review.reviewName)}
                                      >
                                        <SelectTrigger className={cn(
                                          "h-7 text-[10px] w-[80px] border-transparent hover:border-input bg-transparent hover:bg-muted/50",
                                          (review.state || "Active") === "Active" && "text-green-600 border-green-200 bg-green-50"
                                        )}>
                                          <SelectValue placeholder="State" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Active" className="text-green-600 font-medium">Active</SelectItem>
                                          <SelectItem value="Complete">Complete</SelectItem>
                                          <SelectItem value="Archived">Archived</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-[10px] h-5 py-0 font-medium",
                                          (review.state || "Active") === "Active" && "text-green-600 border-green-600/30 bg-green-50"
                                        )}
                                      >
                                        {review.state || "Active"}
                                      </Badge>
                                    )}
                                    
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "text-[10px] h-5 py-0 whitespace-nowrap",
                                        review.isOverdue && "text-destructive border-destructive/30 bg-destructive/5"
                                      )}
                                    >
                                      {formatReviewStatus(review)}
                                    </Badge>
                                  </div>
                                  {isAdmin && (
                                    <Select
                                      disabled={isPending}
                                      value={review.specificStatus || "In Progress"}
                                      onValueChange={(v) => handleUpdate(review.id, "specificStatus", v, review.reviewName, true)}
                                    >
                                      <SelectTrigger className="h-7 text-[10px] w-full border-transparent hover:border-input bg-transparent hover:bg-muted/50">
                                        <SelectValue placeholder="Status" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Awaiting Design Review">Awaiting Design Review</SelectItem>
                                        <SelectItem value="Awaiting Client Review">Awaiting Client Review</SelectItem>
                                        <SelectItem value="Resolved">Resolved</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
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
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Lifecycle Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the {pendingUpdate?.field === 'dueDate' ? 'due date' : pendingUpdate?.field} of <strong>{pendingUpdate?.reviewName}</strong> to <strong>{pendingUpdate?.field === 'dueDate' ? formatDate(pendingUpdate?.value) : pendingUpdate?.value}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={executeUpdate} disabled={isPending}>
              {isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
