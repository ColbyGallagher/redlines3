"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Clock, Download, FileText, MapPin, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import type { ReviewDetail } from "@/lib/data/reviews"
import { cn } from "@/lib/utils"

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

  const documentColumns = useMemo(
    () => [
      { id: "name", label: "Document" },
      { id: "code", label: "Code" },
      { id: "state", label: "State" },
      { id: "milestone", label: "Milestone" },
      { id: "suitability", label: "Suitability" },
      { id: "version", label: "Version" },
      { id: "revision", label: "Revision" },
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
          <CardHeader className="space-y-1">
            <CardTitle>Assigned team</CardTitle>
            <CardDescription>People contributing to this review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {review.reviewers.map((reviewer) => (
              <div key={reviewer.id} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-9">
                    <AvatarFallback>{reviewer.avatarFallback}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {reviewer.firstName} {reviewer.lastName}
                    </p>
                    <p className="text-muted-foreground text-xs">{reviewer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{reviewer.role}</p>
                  <p className="text-muted-foreground text-xs">{reviewer.jobTitle}</p>
                </div>
              </div>
            ))}
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
            <Button variant="outline">Upload document</Button>
            <Button variant="ghost">Manage library</Button>
          </div>
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {documentColumns.map((column) => (
                  <TableHead key={column.id}>{column.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {review.documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell className="font-medium">{document.documentName}</TableCell>
                  <TableCell>{document.documentCode}</TableCell>
                  <TableCell>{document.state}</TableCell>
                  <TableCell>{document.milestone}</TableCell>
                  <TableCell>{document.suitability}</TableCell>
                  <TableCell>{document.version}</TableCell>
                  <TableCell>{document.revision}</TableCell>
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
                  </TableCell>
                </TableRow>
              ))}
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
    </div>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(undefined, {
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

