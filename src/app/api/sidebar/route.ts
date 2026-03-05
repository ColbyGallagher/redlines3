import "server-only"

import { NextResponse } from "next/server"

import { getProjectSummaries } from "@/lib/data/projects"
import { getReviewSummaries } from "@/lib/data/reviews"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const revalidate = 0

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    let userProfile = null
    if (user) {
      // Try to read from the users table (saved profile)
      const { data: dbProfile } = await (supabase.from("users") as any)
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single()

      if (dbProfile) {
        userProfile = {
          first_name: dbProfile.first_name || "",
          last_name: dbProfile.last_name || "",
          email: dbProfile.email || user.email || "",
        }
      } else {
        // Fall back to auth metadata
        userProfile = {
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          email: user.email || "",
        }
      }
    }

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

    return NextResponse.json({ projects: projectList, reviews: reviewList, user: userProfile }, { status: 200 })
  } catch (error) {
    console.error("Failed to load sidebar data", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


