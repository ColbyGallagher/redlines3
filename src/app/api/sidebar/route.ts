import "server-only"

import { NextResponse } from "next/server"

import { getProjectSummaries } from "@/lib/data/projects"
import { getReviewSummaries } from "@/lib/data/reviews"

export const runtime = "nodejs"
export const revalidate = 0

export async function GET() {
  try {
    const [projects, reviews] = await Promise.all([getProjectSummaries(), getReviewSummaries()])

    const projectList = projects.map((project) => ({
      id: project.project.id,
      name: project.project.projectName,
    }))

    const reviewList = reviews.slice(0, 5).map((review) => ({
      id: review.id,
      name: review.reviewName,
      href: `/reviews/${review.id}`,
    }))

    return NextResponse.json({ projects: projectList, reviews: reviewList }, { status: 200 })
  } catch (error) {
    console.error("Failed to load sidebar data", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


