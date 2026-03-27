"use client"

import React, { useEffect, useMemo, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Clock, Download, FileText, MapPin, Trash2, Users, ChevronRight, ChevronDown, Layers, ArrowUpDown, Filter, Search, X, ChevronUp, CheckCircle2, Trophy, Medal } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import type { ReviewDetail } from "@/lib/data/reviews"
import { deleteDocument } from "@/lib/actions/documents"
import { updateReviewLifecycle, getReviewTimelineProgress, type ReviewTimelineProgress } from "@/lib/actions/reviews"
import { markReviewAsComplete } from "@/lib/actions/review-progress"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTransition } from "react"
import { cn } from "@/lib/utils"
import { UploadDocumentDialog } from "@/components/reviews/upload-document-dialog"
import { AddReviewerDialog } from "@/components/reviews/add-reviewer-dialog"
import { ReviewProgressBar } from "@/components/reviews/review-progress-bar"

type ReviewDetailsViewProps = {
  review: ReviewDetail
  isAdmin?: boolean
  availableMilestones?: string[]
}

const statusVariantMap: Record<ReviewDetail["status"], { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  Draft: { label: "Draft", variant: "secondary" },
  "In Review": { label: "In Review", variant: "default" },
  "Awaiting Client": { label: "Awaiting Client", variant: "outline" },
  Approved: { label: "Approved", variant: "outline" },
  Flagged: { label: "Flagged", variant: "destructive" },
}

const importanceBadgeVariant: Record<string, "default" | "secondary" | "destructive"> = {
  High: "destructive",
  Medium: "default",
  Low: "secondary",
}

function formatFileSize(size: number | string | undefined | null) {
  if (size === undefined || size === null) return "0 KB"
  const bytes = typeof size === "string" ? parseInt(size, 10) : size
  if (isNaN(bytes)) return "0 KB"
  if (bytes >= 1048576) {
    return (bytes / 1048576).toFixed(1) + " MB"
  }
  return Math.round(bytes / 1024) + " KB"
}

export function ReviewDetailsView({ review, isAdmin, availableMilestones = [] }: ReviewDetailsViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<{
    field: "status" | "specificStatus" | "phaseId" | "milestone" | "dueDate" | "state";
    value: string;
  } | null>(null)
  
  const statusBadge = statusVariantMap[review.status]
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedDocument, setSelectedDocument] = useState<{ id: string; name: string } | null>(null)
  const [deleteIssues, setDeleteIssues] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>([])
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)
  const [bulkDeleteIncludeIssues, setBulkDeleteIncludeIssues] = useState(false)
  const [isDeletingSelection, setIsDeletingSelection] = useState(false)
  const [expandedParents, setExpandedParents] = useState<string[]>([])
  
  const [timelineProgress, setTimelineProgress] = useState<ReviewTimelineProgress | null>(null)

  useEffect(() => {
    async function fetchTimeline() {
      try {
        const data = await getReviewTimelineProgress(review.id)
        setTimelineProgress(data)
      } catch (error) {
        console.error("Failed to fetch timeline progress:", error)
      }
    }
    fetchTimeline()
  }, [review.id])

  // Resizable columns state
  const [columnWidths, setColumnWidths] = useState({
    selection: 40,
    name: 300,
    code: 150,
    state: 100,
    milestone: 120,
    suitability: 100,
    version: 80,
    revision: 80,
    issues: 80,
    fileSize: 100,
    uploaded: 150,
    actions: 250
  })

  const [columnOrder, setColumnOrder] = useState<string[]>([
    "name",
    "code",
    "state",
    "milestone",
    "suitability",
    "version",
    "revision",
    "issues",
    "fileSize",
    "uploaded",
    "actions",
  ])

  const [draggedColumn, setDraggedColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    if (columnId === "actions" || columnId === "selection") return
    setDraggedColumn(columnId)
    e.dataTransfer.setData("columnId", columnId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    if (columnId === "actions" || columnId === "selection") return
    e.preventDefault()
    setDragOverColumn(columnId)
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    if (targetColumnId === "actions" || targetColumnId === "selection") return
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

  const handleUpdate = (field: "status" | "specificStatus" | "phaseId" | "milestone" | "dueDate" | "state", value: string, skipConfirm = false) => {
    if (skipConfirm) {
      executeLifecycleUpdate(field, value)
    } else {
      setPendingUpdate({ field, value })
      setConfirmOpen(true)
    }
  }

  const executeLifecycleUpdate = (field: "status" | "specificStatus" | "phaseId" | "milestone" | "dueDate" | "state", value: string) => {
    startTransition(async () => {
      const payload: any = { [field]: value }
      const result = await updateReviewLifecycle(review.id, review.project.id, payload)
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

  const handleCompleteReview = async () => {
    const toastId = toast.loading("Marking review as complete...")
    try {
      const result = await markReviewAsComplete(review.id)
      if (result.success) {
        toast.success(result.message, { id: toastId })
        router.refresh()
      } else {
        toast.error(result.message || "Failed to mark review as complete.", { id: toastId })
      }
    } catch (error) {
      toast.error("An unexpected error occurred", { id: toastId })
    }
  }

  const getReviewerStatus = (reviewer: any) => {
    if (reviewer.completedAt) return { label: "Complete", variant: "default" as const, color: "bg-green-500" }
    
    const viewedCount = reviewer.viewedDocumentIds?.length || 0
    const totalDocs = review.documents.length
    
    if (viewedCount === 0) return { label: "Not started", variant: "outline" as const, color: "bg-muted" }
    if (viewedCount === totalDocs) return { label: "Opened all docs", variant: "secondary" as const, color: "bg-blue-500" }
    return { label: `Opened ${viewedCount} doc${viewedCount === 1 ? "" : "s"}`, variant: "secondary" as const, color: "bg-amber-500" }
  }

  const formatDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "-"
    const startTime = new Date(start).getTime()
    const endTime = new Date(end).getTime()
    const diffMs = endTime - startTime
    if (diffMs <= 0) return "-"
    
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHrs > 0) return `${diffHrs}h ${diffMins}m`
    return `${diffMins}m`
  }

  // Sorting and Filtering state
  const [sortConfig, setSortConfig] = useState<{ key: string | null; direction: "asc" | "desc" | null }>({
    key: null,
    direction: null,
  })
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})

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
    review.documents.forEach((doc) => {
      const val = (doc as any)[columnId]
      if (val !== undefined && val !== null && val !== "") {
        values.add(String(val))
      }
    })
    return Array.from(values).sort()
  }

  const filteredAndSortedDocuments = useMemo(() => {
    let docs = [...review.documents]

    // Apply filtering
    if (Object.keys(columnFilters).length > 0) {
      docs = docs.filter((doc) => {
        return Object.entries(columnFilters).every(([key, filterValue]) => {
          const docValue = String((doc as any)[key] || "").toLowerCase()
          return docValue.includes(filterValue.toLowerCase())
        })
      })

      // If a child matches, we must ensure its parent is also in the list if it's not already
      const topLevelDocs = docs.filter((d) => !d.parentId)
      const childDocs = docs.filter((d) => d.parentId)
      
      const parentsOfVisibleChildren = review.documents.filter(parent => 
        childDocs.some(child => child.parentId === parent.id) && !topLevelDocs.some(d => d.id === parent.id)
      )
      
      docs = [...topLevelDocs, ...childDocs, ...parentsOfVisibleChildren]
    }

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      const { key, direction } = sortConfig
      docs.sort((a, b) => {
        const valA = String((a as any)[key] || "").toLowerCase()
        const valB = String((b as any)[key] || "").toLowerCase()

        if (valA < valB) return direction === "asc" ? -1 : 1
        if (valA > valB) return direction === "asc" ? 1 : -1
        return 0
      })
    }

    return docs
  }, [review.documents, sortConfig, columnFilters])

  const isResizing = useRef<string | null>(null)
  const startX = useRef<number>(0)
  const startWidth = useRef<number>(0)

  const handleMouseDown = (e: React.MouseEvent, column: keyof typeof columnWidths) => {
    isResizing.current = column
    startX.current = e.pageX
    startWidth.current = columnWidths[column]
    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = "col-resize"
    e.preventDefault()
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return
    const diff = e.pageX - startX.current
    const newWidth = Math.max(50, startWidth.current + diff)
    
    setColumnWidths(prev => ({
      ...prev,
      [isResizing.current as string]: newWidth
    }))
  }, [])

  const handleMouseUp = useCallback(() => {
    isResizing.current = null
    document.removeEventListener("mousemove", handleMouseMove)
    document.removeEventListener("mouseup", handleMouseUp)
    document.body.style.cursor = "default"
  }, [handleMouseMove])

  const handleDeleteDocument = async () => {
    if (!selectedDocument) return

    setIsDeleting(true)
    try {
      const result = await deleteDocument(selectedDocument.id, review.id, deleteIssues)
      if (result.message === "Success") {
        toast.success("Document deleted successfully")
        setDeleteDialogOpen(false)
        setSelectedDocument(null)
        setSelectedDocumentIds((prev) => prev.filter((id) => id !== selectedDocument.id))
        router.refresh()
      } else {
        toast.error(result.message || "Failed to delete document")
      }
    } catch (error) {
      toast.error("An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const openDeleteDialog = (id: string, name: string) => {
    setSelectedDocument({ id, name })
    setDeleteDialogOpen(true)
    setDeleteIssues(false)
  }

  useEffect(() => {
    setSelectedDocumentIds((current) =>
      current.filter((id) => review.documents.some((document) => document.id === id)),
    )
  }, [review.documents])

  const selectedDocuments = review.documents.filter((document) =>
    selectedDocumentIds.includes(document.id),
  )

  const issuesPerDocument = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const issue of review.issues) {
      const documentId = issue.documentId
      if (!documentId) {
        continue
      }

      counts[documentId] = (counts[documentId] ?? 0) + 1
    }

    return counts
  }, [review.issues])

  const toggleDocumentSelection = (documentId: string) => {
    setSelectedDocumentIds((previous) =>
      previous.includes(documentId)
        ? previous.filter((id) => id !== documentId)
        : [...previous, documentId],
    )
  }
  
  const toggleParentExpansion = (parentId: string) => {
    setExpandedParents(prev => 
      prev.includes(parentId) 
        ? prev.filter(id => id !== parentId)
        : [...prev, parentId]
    )
  }

  const handleSelectAllDocuments = (checked: boolean | "indeterminate") => {
    if (checked === true) {
      setSelectedDocumentIds(review.documents.map((document) => document.id))
      return
    }

    setSelectedDocumentIds([])
  }

  const handleDownloadSelected = () => {
    if (typeof document === "undefined") {
      return
    }

    selectedDocuments.forEach((doc) => {
      if (!doc.pdfUrl) {
        return
      }
      const link = document.createElement("a")
      link.href = doc.pdfUrl
      link.target = "_blank"
      link.rel = "noreferrer"
      link.download = doc.documentName || "document"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
  }

  const handleBulkDelete = async () => {
    if (!selectedDocumentIds.length) {
      return
    }

    setIsDeletingSelection(true)
    setBulkDeleteDialogOpen(false)

    try {
      for (const documentId of selectedDocumentIds) {
        const result = await deleteDocument(documentId, review.id, bulkDeleteIncludeIssues)

        if (result.message !== "Success") {
          throw new Error(result.message ?? "Failed to delete documents")
        }
      }

      toast.success("Documents deleted successfully")
      setSelectedDocumentIds([])
      setBulkDeleteIncludeIssues(false)
      router.refresh()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete selected documents"
      toast.error(message)
    } finally {
      setIsDeletingSelection(false)
    }
  }

  const documentColumns = useMemo(
    () => [
      { id: "name", label: "Document" },
      { id: "code", label: "Code" },
      { id: "state", label: "State" },
      { id: "milestone", label: "Milestone" },
      { id: "suitability", label: "Suitability" },
      { id: "version", label: "Version" },
      { id: "revision", label: "Revision" },
      { id: "issues", label: "Issues" },
      { id: "fileSize", label: "File size" },
      { id: "uploaded", label: "Uploaded" },
      { id: "actions", label: "" },
    ],
    []
  )

  const sortedDocumentColumns = useMemo(() => {
    return columnOrder.map((id) => documentColumns.find((col) => col.id === id)!)
  }, [columnOrder, documentColumns])

  const renderCell = (columnId: string, document: any, review: ReviewDetail, isChild: boolean = false) => {
    const children = review.documents.filter((d) => d.parentId === document.id)
    const hasChildren = children.length > 0
    const isExpanded = expandedParents.includes(document.id)

    switch (columnId) {
      case "name":
        return (
          <TableCell style={{ width: columnWidths.name }} className={cn("font-medium", isChild && "pl-10")}>
            <div className="flex items-center gap-2">
              {!isChild && hasChildren && (
                <Button variant="ghost" size="icon" className="h-6 w-6 p-0" onClick={() => toggleParentExpansion(document.id)}>
                  {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                </Button>
              )}
              {isChild && (
                <div className="size-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                  {document.pageNumber}
                </div>
              )}
              {hasChildren && !isChild ? (
                <div className="flex items-center gap-2 text-primary">
                  <Layers className="size-4" />
                  <span>{document.documentName}</span>
                  <Badge variant="secondary" className="text-[10px] h-4 px-1">
                    {children.length} drawings
                  </Badge>
                </div>
              ) : (
                <Link
                  href={`/reviews/${review.id}/documents/${document.id}${isChild && document.pageNumber ? `?page=${document.pageNumber}` : ""}`}
                  prefetch={false}
                  className={cn("text-primary hover:underline font-medium text-left", isChild && "text-xs")}
                >
                  {document.documentName}
                </Link>
              )}
            </div>
          </TableCell>
        )
      case "code":
        return (
          <TableCell style={{ width: columnWidths.code }} className={cn("truncate", isChild && "text-xs")}>
            {document.documentCode}
          </TableCell>
        )
      case "state":
        return (
          <TableCell style={{ width: columnWidths.state }} className={cn("truncate", isChild && "text-xs")}>
            {document.state}
          </TableCell>
        )
      case "milestone":
        return (
          <TableCell style={{ width: columnWidths.milestone }} className={cn("truncate", isChild && "text-xs")}>
            {document.milestone}
          </TableCell>
        )
      case "suitability":
        return (
          <TableCell style={{ width: columnWidths.suitability }} className={cn("truncate", isChild && "text-xs")}>
            {document.suitability}
          </TableCell>
        )
      case "version":
        return (
          <TableCell style={{ width: columnWidths.version }} className={cn("truncate", isChild && "text-xs")}>
            {document.version}
          </TableCell>
        )
      case "revision":
        return (
          <TableCell style={{ width: columnWidths.revision }} className={cn("truncate", isChild && "text-xs")}>
            {document.revision}
          </TableCell>
        )
      case "issues":
        return (
          <TableCell style={{ width: columnWidths.issues }} className={cn("truncate", isChild && "text-xs")}>
            {hasChildren && !isChild
              ? children.reduce((acc, child) => acc + (issuesPerDocument[child.id] ?? 0), 0) + (issuesPerDocument[document.id] ?? 0)
              : issuesPerDocument[document.id] ?? 0}
          </TableCell>
        )
      case "fileSize":
        return (
          <TableCell style={{ width: columnWidths.fileSize }} className={cn("truncate", isChild && "text-xs")}>
            {formatFileSize(document.fileSize)}
          </TableCell>
        )
      case "uploaded":
        return (
          <TableCell style={{ width: columnWidths.uploaded }} className={cn("truncate", isChild && "text-xs")}>
            {formatDate(document.uploadedAt)}
          </TableCell>
        )
      case "actions":
        return (
          <TableCell style={{ width: columnWidths.actions }} className="text-right">
            {!isChild ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1"
                  onClick={() => router.push(`/reviews/${review.id}/documents/${document.id}`)}
                >
                  <FileText className="size-4" />
                  Preview
                </Button>
                <Button variant="ghost" size="sm" className="gap-1">
                  <Download className="size-4" />
                  Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => openDeleteDialog(document.id, document.documentName)}
                >
                  <Trash2 className="size-4" />
                  Delete
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2"
                onClick={() => router.push(`/reviews/${review.id}/documents/${document.id}${document.pageNumber ? `?page=${document.pageNumber}` : ""}`)}
              >
                <FileText className="size-3" />
                <span className="text-[10px]">Preview</span>
              </Button>
            )}
          </TableCell>
        )
      default:
        return null
    }
  }

  const issueColumns = useMemo(
    () => [
      { id: "issueNumber", label: "Issue #" },
      { id: "status", label: "Status" },
      { id: "importance", label: "Importance" },
      { id: "discipline", label: "Discipline" },
      { id: "document", label: "Document" },
      { id: "page", label: "Page" },
      { id: "coordinates", label: "Coordinates" },
      { id: "created", label: "Created" },
      { id: "updated", label: "Updated" },
      { id: "actions", label: "" },
    ],
    []
  )

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 pt-4 min-w-0">
      <Breadcrumb className="text-sm">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/projects/${review.project.id}`}>
                {review.project.projectName || "Project"}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{review.reviewName}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{review.reviewName}</h1>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-sm">
            <span>Review number: {review.reviewNumber}</span>
            <Separator orientation="vertical" className="hidden h-4 lg:block" />
            <span className="flex items-center gap-1">
              <MapPin className="size-4" />
              {review.project.projectLocation}
            </span>
            <Separator orientation="vertical" className="hidden h-4 lg:block" />
            <span className="flex items-center gap-1">
              <Users className="size-4" />
              {review.reviewers.length} assigned
            </span>
            <Separator orientation="vertical" className="hidden h-4 lg:block" />
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "flex items-center gap-1",
                  isAdmin && "cursor-pointer hover:bg-accent transition-colors"
                )}
                onClick={() => isAdmin && handleUpdate("state", review.state === "Complete" ? "Active" : "Complete")}
              >
                <Layers className="size-3" />
                {review.state}
              </Badge>
              <Badge 
                variant="outline" 
                className={cn(
                  "flex items-center gap-1",
                  isAdmin && "cursor-pointer hover:bg-accent transition-colors"
                )}
                onClick={() => isAdmin && handleUpdate("specificStatus", review.specificStatus === "Resolved" ? "In Progress" : "Resolved")}
              >
                <Clock className="size-3" />
                {review.specificStatus}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <div className="flex items-center gap-2 mr-2">
              <Badge 
                variant="outline" 
                className={cn(
                  "h-9 px-3 flex items-center justify-center font-medium",
                  (review.state || "Active") === "Active" && "text-green-600 border-green-600/30 bg-green-50",
                  (review.state || "Active") === "Complete" && "text-blue-600 border-blue-600/30 bg-blue-50",
                  (review.state || "Active") === "Archived" && "text-muted-foreground border-muted-foreground/30 bg-muted"
                )}
              >
                {review.state || "Active"}
              </Badge>
              
              <Select
                disabled={isPending}
                value={review.phaseId || review.specificStatus || "In Progress"}
                onValueChange={(v) => {
                  if (v.includes("-")) {
                    handleUpdate("phaseId", v)
                  } else {
                    handleUpdate("specificStatus", v)
                  }
                }}
              >
                <SelectTrigger className="h-9 w-[200px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {timelineProgress?.phases && timelineProgress.phases.length > 0 ? (
                    timelineProgress.phases.map((phase) => (
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
            </div>
          )}
          <Button variant="outline">Export summary</Button>
          <Button 
            variant="default" 
            className="bg-green-600 hover:bg-green-700 text-white gap-2"
            onClick={handleCompleteReview}
          >
            <CheckCircle2 className="size-4" />
            I've completed my review
          </Button>
          <Button>Create issue</Button>
        </div>
      </div>

      {timelineProgress && (
        <Card className="p-4 bg-muted/20">
          <ReviewProgressBar 
            startDate={timelineProgress.startDate} 
            phases={timelineProgress.phases} 
          />
        </Card>
      )}

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Review overview</CardTitle>
            <CardDescription>Key dates and milestone progress</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Milestone</p>
              {isAdmin ? (
                <Select
                  disabled={isPending}
                  value={review.milestone}
                  onValueChange={(v) => handleUpdate("milestone", v, true)}
                >
                  <SelectTrigger className="h-9 w-full">
                    <SelectValue placeholder="Select milestone" />
                  </SelectTrigger>
                  <SelectContent>
                    {review.milestone && !availableMilestones.includes(review.milestone) && review.milestone !== "Unspecified" && (
                      <SelectItem key={review.milestone} value={review.milestone}>{review.milestone}</SelectItem>
                    )}
                    {(!review.milestone || review.milestone === "Unspecified") && !availableMilestones.includes("Unspecified") && (
                      <SelectItem value="Unspecified">Unspecified</SelectItem>
                    )}
                    {availableMilestones.filter(Boolean).map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-base font-medium">{review.milestone}</p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Project</p>
              <p className="text-base font-medium">{review.project.projectName}</p>
              <p className="text-muted-foreground text-xs">{review.project.projectNumber}</p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Calendar className="size-4" /> Client SME comments due
              </p>
              {isAdmin ? (
                <input
                  type="date"
                  className={cn(
                    "h-9 w-full px-3 py-1 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    deadlineClass(review.dueDateSmeReview)
                  )}
                  value={review.dueDateSmeReview ? review.dueDateSmeReview.split('T')[0] : ""}
                  onChange={(e) => handleUpdate("dueDate", e.target.value, true)}
                  disabled={isPending}
                />
              ) : (
                <p className={cn("text-sm font-medium", deadlineClass(review.dueDateSmeReview))}>
                  {formatDate(review.dueDateSmeReview)}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Calendar className="size-4" /> Consultant issue comments due
              </p>
              {isAdmin ? (
                <input
                  type="date"
                  className={cn(
                    "h-9 w-full px-3 py-1 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    deadlineClass(review.dueDateIssueComments)
                  )}
                  value={review.dueDateIssueComments ? review.dueDateIssueComments.split('T')[0] : ""}
                  onChange={(e) => handleUpdate("dueDate", e.target.value, true)}
                  disabled={isPending}
                />
              ) : (
                <p className={cn("text-sm font-medium", deadlineClass(review.dueDateIssueComments))}>
                  {formatDate(review.dueDateIssueComments)}
                </p>
              )}
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Calendar className="size-4" /> Client replies due
              </p>
              {isAdmin ? (
                <input
                  type="date"
                  className={cn(
                    "h-9 w-full px-3 py-1 text-sm rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                    deadlineClass(review.dueDateReplies)
                  )}
                  value={review.dueDateReplies ? review.dueDateReplies.split('T')[0] : ""}
                  onChange={(e) => handleUpdate("dueDate", e.target.value, true)}
                  disabled={isPending}
                />
              ) : (
                <p className={cn("text-sm font-medium", deadlineClass(review.dueDateReplies))}>
                  {formatDate(review.dueDateReplies)}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <p className="text-muted-foreground text-sm">Summary</p>
              <p className="text-sm leading-relaxed">{review.summary}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="space-y-1">
              <CardTitle>Assigned team</CardTitle>
              <CardDescription>People contributing to this review</CardDescription>
            </div>
            <AddReviewerDialog
              reviewId={review.id}
              existingReviewerIds={review.reviewers.map(r => r.id)}
            />
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Person</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Issues</TableHead>
                  <TableHead className="text-right whitespace-nowrap">Time taken</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {review.reviewers.map((reviewer) => {
                  const issuesRaisedCount = review.issues.filter(
                    (issue) => issue.createdByUserId === reviewer.id
                  ).length
                  const status = getReviewerStatus(reviewer)

                  return (
                    <TableRow key={reviewer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-8">
                            <AvatarFallback>{reviewer.avatarFallback}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">
                              {reviewer.firstName} {reviewer.lastName}
                            </span>
                            <span className="text-muted-foreground text-xs">{reviewer.email}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{reviewer.role}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                           <div className={cn("size-2 rounded-full", status.color)} />
                           <Badge variant={status.variant} className="font-normal text-[10px] sm:text-xs">
                             {status.label}
                           </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{issuesRaisedCount}</TableCell>
                      <TableCell className="text-right text-muted-foreground text-[10px] sm:text-xs font-mono">
                        {formatDuration(reviewer.startedAt, reviewer.completedAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Documents</h2>
            <p className="text-muted-foreground text-sm">Required files for this review</p>
          </div>
          <div className="flex items-center gap-2">
            <UploadDocumentDialog reviewId={review.id} projectId={review.project.id} />
            <Button variant="ghost">Manage library</Button>
          </div>
        </div>
        <Card>
          {selectedDocumentIds.length > 0 && (
            <div className="flex items-center justify-between gap-4 border-b px-4 py-3 text-sm">
              <p className="text-muted-foreground">
                {selectedDocumentIds.length} document
                {selectedDocumentIds.length === 1 ? "" : "s"} selected
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSelected}
                  disabled={!selectedDocumentIds.length}
                >
                  Download selected
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBulkDeleteDialogOpen(true)}
                  disabled={isDeletingSelection}
                >
                  {isDeletingSelection ? "Deleting…" : "Delete selected"}
                </Button>
              </div>
            </div>
          )}
          <div className="overflow-x-auto">
            <Table style={{ tableLayout: "fixed", width: "100%" }}>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: columnWidths.selection }} className="px-2 relative group">
                    <Checkbox
                      checked={
                        review.documents.length > 0 && selectedDocumentIds.length === review.documents.length
                          ? true
                          : selectedDocumentIds.length > 0
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(checked) => handleSelectAllDocuments(checked)}
                      aria-label="Select all documents"
                    />
                    <div
                      onMouseDown={(e) => handleMouseDown(e, "selection")}
                      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/20 transition-colors"
                    />
                  </TableHead>
                  {sortedDocumentColumns.map((column) => (
                    <TableHead
                      key={column.id}
                      style={{ width: columnWidths[column.id as keyof typeof columnWidths] }}
                      className={cn(
                        "relative group cursor-default",
                        draggedColumn === column.id && "opacity-50",
                        dragOverColumn === column.id && "bg-primary/10 border-r-2 border-r-primary"
                      )}
                      draggable={column.id !== "actions"}
                      onDragStart={(e) => handleDragStart(e, column.id)}
                      onDragOver={(e) => handleDragOver(e, column.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, column.id)}
                    >
                      <div className="flex items-center gap-1">
                        <span 
                          className="cursor-pointer hover:text-primary transition-colors flex items-center gap-1"
                          onClick={() => column.id !== "actions" && handleSort(column.id)}
                        >
                          {column.label}
                          {sortConfig.key === column.id && (
                            sortConfig.direction === "asc" ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />
                          )}
                        </span>
                        
                        {column.id !== "actions" && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-6 h-6 w-6 p-0 hover:bg-transparent">
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
                                    onChange={(e) => handleFilterChange(column.id, e.target.value)}
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
                        )}
                      </div>
                      
                      {column.id !== "actions" && (
                        <div
                          onMouseDown={(e) => handleMouseDown(e, column.id as keyof typeof columnWidths)}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 group-hover:bg-primary/20 transition-colors"
                        />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
            <TableBody>
              {filteredAndSortedDocuments
                .filter((doc) => !doc.parentId) // Only show top-level documents initially
                .map((document) => {
                  const children = filteredAndSortedDocuments.filter((d) => d.parentId === document.id)
                  const isExpanded = expandedParents.includes(document.id)
                  const hasChildren = children.length > 0 || review.documents.some(d => d.parentId === document.id)

                  return (
                    <React.Fragment key={document.id}>
                      <TableRow className={cn(hasChildren && "bg-muted/10 font-medium")}>
                        <TableCell style={{ width: columnWidths.selection }} className="px-2">
                          <Checkbox
                            checked={selectedDocumentIds.includes(document.id)}
                            onCheckedChange={(checked) => toggleDocumentSelection(document.id)}
                            aria-label={`Select ${document.documentName}`}
                          />
                        </TableCell>
                        {columnOrder.map((columnId) => (
                          <React.Fragment key={columnId}>
                            {renderCell(columnId, document, review)}
                          </React.Fragment>
                        ))}
                      </TableRow>

                      {hasChildren &&
                        isExpanded &&
                        children.map((child) => (
                          <TableRow key={child.id} className="bg-muted/5 border-l-2 border-l-primary/30">
                            <TableCell style={{ width: columnWidths.selection }} className="px-2">
                              <Checkbox
                                checked={selectedDocumentIds.includes(child.id)}
                                onCheckedChange={(checked) => toggleDocumentSelection(child.id)}
                                aria-label={`Select ${child.documentName}`}
                              />
                            </TableCell>
                            {columnOrder.map((columnId) => (
                              <React.Fragment key={columnId}>
                                {renderCell(columnId, child, review, true)}
                              </React.Fragment>
                            ))}
                          </TableRow>
                        ))}
                    </React.Fragment>
                  )
                })}
            </TableBody>
          </Table>
          </div>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Issues</h2>
            <p className="text-muted-foreground text-sm">Tracked findings for this review</p>
          </div>
          <Button variant="outline">Export issues</Button>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {issueColumns.map((column) => (
                  <TableHead key={column.id}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {review.issues.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="font-medium">{issue.issueNumber}</TableCell>
                  <TableCell>
                    <Badge variant={issue.status === "Open" ? "destructive" : "default"}>{issue.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={importanceBadgeVariant[issue.importance] ?? "secondary"}>{issue.importance}</Badge>
                  </TableCell>
                  <TableCell>{issue.discipline}</TableCell>
                  <TableCell>{lookupDocumentName(review, issue.documentId)}</TableCell>
                  <TableCell>{issue.pageNumber}</TableCell>
                  <TableCell>{issue.commentCoordinates}</TableCell>
                  <TableCell>{formatDate(issue.dateCreated)}</TableCell>
                  <TableCell>{formatDate(issue.dateModified)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="gap-1">
                      <FileText className="size-4" />
                      Open issue
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Timeline</CardTitle>
              <CardDescription>Latest activity for this review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              {review.issues.slice(0, 3).map((issue) => (
                <div key={issue.id} className="space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {formatDate(issue.dateModified)}
                    </span>
                    <Badge variant="outline">{issue.status}</Badge>
                  </div>
                  <p className="font-medium">{issue.issueNumber}</p>
                  <p className="text-muted-foreground">{issue.comment}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle>Notes</CardTitle>
              <CardDescription>Capture decisions and next steps</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Use an external collaboration space to log final sign-off, schedule meetings, or add links to supporting materials.
              </p>
              <Button variant="outline" className="w-full">
                Open shared notes
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Leaderboard Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-500" />
            <h2 className="text-xl font-semibold">Review Leaderboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
            {review.reviewers
                .filter(r => r.completedAt)
                .sort((a, b) => {
                    const startTimeA = new Date(a.startedAt!).getTime()
                    const endTimeA = new Date(a.completedAt!).getTime()
                    const startTimeB = new Date(b.startedAt!).getTime()
                    const endTimeB = new Date(b.completedAt!).getTime()
                    return (endTimeA - startTimeA) - (endTimeB - startTimeB)
                })
                .slice(0, 3)
                .map((reviewer, index) => {
                    const timeTotal = formatDuration(reviewer.startedAt, reviewer.completedAt)
                    const issuesCount = review.issues.filter(i => i.createdByUserId === reviewer.id).length
                    
                    return (
                        <Card key={reviewer.id} className={cn(
                            "relative overflow-hidden border-2",
                            index === 0 ? "border-amber-500/20 bg-amber-50/10" : "border-muted"
                        )}>
                            {index === 0 && (
                                <div className="absolute top-0 right-0 p-2 opacity-10">
                                    <Trophy className="size-16 text-amber-500" />
                                </div>
                            )}
                            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                                <div className="relative">
                                    <Avatar className="size-10 border-2 border-background">
                                        <AvatarFallback>{reviewer.avatarFallback}</AvatarFallback>
                                    </Avatar>
                                    <div className={cn(
                                        "absolute -top-1 -right-1 size-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm border-2 border-background",
                                        index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-400" : "bg-amber-700"
                                    )}>
                                        {index + 1}
                                    </div>
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold">{reviewer.firstName} {reviewer.lastName}</CardTitle>
                                    <CardDescription className="text-[10px]">{reviewer.role}</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-[10px]">
                                    <div className="flex flex-col">
                                        <span className="text-muted-foreground uppercase font-bold tracking-wider">Completion Time</span>
                                        <span className="font-mono font-bold text-primary">{timeTotal}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-muted-foreground uppercase font-bold tracking-wider">Issues</span>
                                        <span className="font-bold">{issuesCount}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })
            }
            {review.reviewers.filter(r => r.completedAt).length === 0 && (
                <Card className="md:col-span-3 border-dashed bg-muted/5 flex items-center justify-center py-8">
                    <p className="text-muted-foreground text-sm italic opacity-60">No reviews completed yet. Leaderboard will update as reviewers finish.</p>
                </Card>
            )}
        </div>
      </section>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold text-foreground">"{selectedDocument?.name}"</span>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="deleteIssues"
              checked={deleteIssues}
              onCheckedChange={(checked: boolean) => setDeleteIssues(checked)}
            />
            <Label
              htmlFor="deleteIssues"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Delete associated issues and annotations
            </Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteDocument} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={(next) => {
        if (!next) {
          setBulkDeleteIncludeIssues(false)
        }
        setBulkDeleteDialogOpen(next)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected documents</DialogTitle>
            <DialogDescription>
              Remove {selectedDocumentIds.length} document{selectedDocumentIds.length === 1 ? "" : "s"} from this review. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 py-4">
            <Checkbox
              id="bulkDeleteIssues"
              checked={bulkDeleteIncludeIssues}
              onCheckedChange={(checked: boolean) => setBulkDeleteIncludeIssues(checked)}
            />
            <Label
              htmlFor="bulkDeleteIssues"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Delete associated issues and annotations
            </Label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialogOpen(false)} disabled={isDeletingSelection}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeletingSelection}>
              {isDeletingSelection ? "Deleting..." : "Confirm Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Lifecycle Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the {pendingUpdate?.field} of this review to <strong>{pendingUpdate?.value}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button onClick={() => pendingUpdate && executeLifecycleUpdate(pendingUpdate.field, pendingUpdate.value)} disabled={isPending}>
              {isPending ? "Updating..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function deadlineClass(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const today = new Date()
  const diff = date.getTime() - today.setHours(0, 0, 0, 0)

  if (diff < 0) return "text-destructive"
  if (diff < 1000 * 60 * 60 * 24 * 3) return "text-amber-600"
  return ""
}

function lookupDocumentName(review: ReviewDetail, documentId: string) {
  return review.documents.find((document) => document.id === documentId)?.documentName ?? "Unknown document"
}
