"use client"

import React, { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Calendar, Clock, Download, FileText, MapPin, Trash2, Users, ChevronRight, ChevronDown, Layers } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { cn } from "@/lib/utils"
import { UploadDocumentDialog } from "@/components/reviews/upload-document-dialog"
import { AddReviewerDialog } from "@/components/reviews/add-reviewer-dialog"
import { deleteDocument } from "@/lib/actions/documents"

type ReviewDetailsViewProps = {
  review: ReviewDetail
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

export function ReviewDetailsView({ review }: ReviewDetailsViewProps) {
  const router = useRouter()
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
    <div className="space-y-6">
      <Breadcrumb className="text-sm">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
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
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline">Export summary</Button>
          <Button>Create issue</Button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle>Review overview</CardTitle>
            <CardDescription>Key dates and milestone progress</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Milestone</p>
              <p className="text-base font-medium">{review.milestone}</p>
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
              <p className={cn("text-sm font-medium", deadlineClass(review.dueDateSmeReview))}>
                {formatDate(review.dueDateSmeReview)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Calendar className="size-4" /> Consultant issue comments due
              </p>
              <p className={cn("text-sm font-medium", deadlineClass(review.dueDateIssueComments))}>
                {formatDate(review.dueDateIssueComments)}
              </p>
            </div>
            <div className="space-y-2 md:col-span-2">
              <p className="text-muted-foreground text-sm flex items-center gap-2">
                <Calendar className="size-4" /> Client replies due
              </p>
              <p className={cn("text-sm font-medium", deadlineClass(review.dueDateReplies))}>
                {formatDate(review.dueDateReplies)}
              </p>
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
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Issues raised</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {review.reviewers.map((reviewer) => {
                  const issuesRaisedCount = review.issues.filter(
                    (issue) => issue.createdByUserId === reviewer.id
                  ).length

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
                      <TableCell className="text-sm">
                        {reviewer.company || "ColbyGallagher"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-normal">
                          {reviewer.status || "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{issuesRaisedCount}</TableCell>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 px-2">
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
                </TableHead>
                {documentColumns.map((column) => (
                  <TableHead key={column.id}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {review.documents
                .filter(doc => !doc.parentId) // Only show top-level documents initially
                .map((document) => {
                  const children = review.documents.filter(d => d.parentId === document.id)
                  const isExpanded = expandedParents.includes(document.id)
                  const hasChildren = children.length > 0

                  return (
                    <React.Fragment key={document.id}>
                      <TableRow className={cn(hasChildren && "bg-muted/10 font-medium")}>
                        <TableCell className="px-2">
                          <Checkbox
                            checked={selectedDocumentIds.includes(document.id)}
                            onCheckedChange={(checked) => toggleDocumentSelection(document.id)}
                            aria-label={`Select ${document.documentName}`}
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {hasChildren && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 p-0" 
                                onClick={() => toggleParentExpansion(document.id)}
                              >
                                {isExpanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                              </Button>
                            )}
                            {hasChildren ? (
                                <div className="flex items-center gap-2 text-primary">
                                    <Layers className="size-4" />
                                    <span>{document.documentName}</span>
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1">{children.length} drawings</Badge>
                                </div>
                            ) : (
                                <Link
                                    href={`/reviews/${review.id}/documents/${document.id}`}
                                    className="text-primary hover:underline font-medium text-left"
                                >
                                    {document.documentName}
                                </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{document.documentCode}</TableCell>
                        <TableCell>{document.state}</TableCell>
                        <TableCell>{document.milestone}</TableCell>
                        <TableCell>{document.suitability}</TableCell>
                        <TableCell>{document.version}</TableCell>
                        <TableCell>{document.revision}</TableCell>
                        <TableCell>
                            {hasChildren 
                                ? children.reduce((acc, child) => acc + (issuesPerDocument[child.id] ?? 0), 0) + (issuesPerDocument[document.id] ?? 0)
                                : issuesPerDocument[document.id] ?? 0
                            }
                        </TableCell>
                        <TableCell>{document.fileSize}</TableCell>
                        <TableCell>{formatDate(document.uploadedAt)}</TableCell>
                        <TableCell className="text-right">
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
                        </TableCell>
                      </TableRow>
                      
                      {hasChildren && isExpanded && children.map((child) => (
                        <TableRow key={child.id} className="bg-muted/5 border-l-2 border-l-primary/30">
                          <TableCell className="px-2">
                            <Checkbox
                              checked={selectedDocumentIds.includes(child.id)}
                              onCheckedChange={(checked) => toggleDocumentSelection(child.id)}
                              aria-label={`Select ${child.documentName}`}
                            />
                          </TableCell>
                          <TableCell className="pl-10 font-medium">
                            <div className="flex items-center gap-2">
                                <div className="size-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                                    {child.pageNumber}
                                </div>
                                <Link
                                    href={`/reviews/${review.id}/documents/${child.id}`}
                                    className="text-primary hover:underline font-medium text-left text-xs"
                                >
                                    {child.documentName}
                                </Link>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs">{child.documentCode}</TableCell>
                          <TableCell className="text-xs">{child.state}</TableCell>
                          <TableCell className="text-xs">{child.milestone}</TableCell>
                          <TableCell className="text-xs">{child.suitability}</TableCell>
                          <TableCell className="text-xs">{child.version}</TableCell>
                          <TableCell className="text-xs">{child.revision}</TableCell>
                          <TableCell className="text-xs">{issuesPerDocument[child.id] ?? 0}</TableCell>
                          <TableCell className="text-xs">{child.fileSize}</TableCell>
                          <TableCell className="text-xs">{formatDate(child.uploadedAt)}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => router.push(`/reviews/${review.id}/documents/${child.id}`)}
                            >
                              <FileText className="size-3" />
                              <span className="text-[10px]">Preview</span>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
                  )
                })}
            </TableBody>
          </Table>
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

