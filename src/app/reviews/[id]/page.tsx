import { notFound } from "next/navigation"

import { ReviewDetailsView } from "@/components/reviews/review-details-view"
import { getReviewDetailById } from "@/lib/mock/review-details"

type ReviewPageProps = {
  params: { id: string }
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { id } = params
  const review = getReviewDetailById(id)

  if (!review) {
    notFound()
  }

  return <ReviewDetailsView review={review} />
}

