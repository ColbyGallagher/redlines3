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
import type { ProjectSummary } from "@/lib/mock/projects"

type ProjectReviewsListProps = {
  summary: ProjectSummary
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

export function ProjectReviewsList({ summary }: ProjectReviewsListProps) {
  const reviews = [...summary.reviews].sort((a, b) =>
    a.reviewName.localeCompare(b.reviewName),
  )

  return (
    <Card className="lg:col-span-5 xl:col-span-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="space-y-1">
          <CardTitle>Project Reviews</CardTitle>
          <CardDescription>Track key milestones and upcoming checkpoints</CardDescription>
        </div>
        <Button variant="ghost" size="sm">
          View all
          <ArrowUpRight className="ml-1 size-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm">No reviews logged for this project.</p>
        ) : (
          reviews.map((review, index) => (
            <div key={review.id} className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium leading-tight">{review.reviewName}</p>
                  <p className="text-muted-foreground text-xs">{review.milestone}</p>
                </div>
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                  {formatReviewStatus(review)}
                </span>
              </div>
              <p className="text-muted-foreground text-xs">{formatDueLabel(review)}</p>
              {index < reviews.length - 1 ? <Separator /> : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

