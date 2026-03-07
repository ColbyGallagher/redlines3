import { notFound } from "next/navigation"

import { ReviewDetailsView } from "@/components/reviews/review-details-view"
import { getReviewDetailById } from "@/lib/data/reviews"
import { Button } from "@/components/ui/button"

type ReviewPageProps = {
  params: Promise<{ id: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = await params
  const review = await getReviewDetailById(id)

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">Review not found or access restricted</h1>
        <p className="text-muted-foreground">You may not have permission to view this review.</p>
        <Button asChild>
          <a href="/projects">Go to Projects</a>
        </Button>
      </div>
    )
  }

  return <ReviewDetailsView review={review} />
}

