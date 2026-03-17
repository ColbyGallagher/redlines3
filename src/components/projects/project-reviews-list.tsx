"use client"

import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import type { ProjectSummary } from "@/lib/data/projects"
import { CreateReviewDialog } from "@/components/projects/create-review-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTransition, useState } from "react"
import { updateReviewLifecycle } from "@/lib/actions/reviews"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import type { Milestone } from "@/lib/data/projects"

type ProjectReviewsListProps = {
  summary: ProjectSummary
  isAdmin?: boolean
}

function formatReviewStatus(review: ProjectSummary["reviews"][number]) {
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

function formatDueLabel(review: ProjectSummary["reviews"][number]) {
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

export function ProjectReviewsList({ summary, isAdmin }: ProjectReviewsListProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingUpdate, setPendingUpdate] = useState<{
    reviewId: string;
    field: "state" | "status";
    value: string;
    reviewName: string;
  } | null>(null)
  const [stateFilter, setStateFilter] = useState<string>("Active")
  
  const allReviews = [...summary.reviews].sort((a, b) =>
    a.reviewName.localeCompare(b.reviewName),
  )

  const reviews = allReviews.filter((review) => {
    if (stateFilter === "All") return true
    return (review.state || "Active").toLowerCase() === stateFilter.toLowerCase()
  })

  const handleUpdate = (reviewId: string, field: "state" | "status", value: string, reviewName: string) => {
    setPendingUpdate({ reviewId, field, value, reviewName })
    setConfirmOpen(true)
  }

  const executeUpdate = () => {
    if (!pendingUpdate) return

    startTransition(async () => {
      const result = await updateReviewLifecycle(pendingUpdate.reviewId, summary.project.id, {
        [pendingUpdate.field]: pendingUpdate.value,
      })
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
      setConfirmOpen(false)
      setPendingUpdate(null)
    })
  }

  const milestones = summary.settings.availableMilestones.map((m: Milestone) => m.name)

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
        <CardContent className="space-y-4">
          {reviews.length === 0 ? (
            <p className="text-muted-foreground text-sm">No reviews logged for this project.</p>
          ) : (
            reviews.map((review, index) => (
              <div key={review.id} className="space-y-2">
                <Link
                  href={`/reviews/${review.id}`}
                  className="group block space-y-2 rounded-lg p-3 transition hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/80"
                  aria-label={`Open details for ${review.reviewName}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium leading-tight group-hover:text-primary truncate">
                        {review.reviewName}
                      </p>
                      <p className="text-muted-foreground text-xs">{review.milestone}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 mt-2" onClick={(e) => e.preventDefault()}>
                        {isAdmin ? (
                          <>
                            <Select
                              disabled={isPending}
                              value={review.state || "Active"}
                              onValueChange={(v) => handleUpdate(review.id, "state", v, review.reviewName)}
                            >
                              <SelectTrigger className="h-7 text-[10px] w-[90px]">
                                <SelectValue placeholder="State" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="Complete">Complete</SelectItem>
                                <SelectItem value="Archived">Archived</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            <Select
                              disabled={isPending}
                              value={review.specificStatus || "In Progress"}
                              onValueChange={(v) => handleUpdate(review.id, "status", v, review.reviewName)}
                            >
                              <SelectTrigger className="h-7 text-[10px] w-[130px]">
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
                          </>
                        ) : (
                          <>
                            <Badge variant="outline" className="text-[10px] h-5 py-0">
                              {review.state || "Active"}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] h-5 py-0">
                              {review.specificStatus || "In Progress"}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium whitespace-nowrap">
                      {formatReviewStatus(review)}
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs">{formatDueLabel(review)}</p>
                </Link>
                {index < reviews.length - 1 ? <Separator /> : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Lifecycle Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the {pendingUpdate?.field} of <strong>{pendingUpdate?.reviewName}</strong> to <strong>{pendingUpdate?.value}</strong>?
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
