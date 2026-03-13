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
    let companies: any[] = []

    if (user) {
      // Try to read from the users table (saved profile)
      const { data: dbProfile } = await supabase
        .from("users")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single()

      if (dbProfile) {
        const profile = dbProfile as any
        userProfile = {
          first_name: profile.first_name || "",
          last_name: profile.last_name || "",
          email: profile.email || user.email || "",
        }
      } else {
        // Fall back to auth metadata
        userProfile = {
          first_name: user.user_metadata?.first_name || "",
          last_name: user.user_metadata?.last_name || "",
          email: user.email || "",
        }
      }

      // Fetch companies and roles user has access to
      const { data: userCompanies } = await supabase
        .from("user_companies")
        .select(`
          company_id,
          active,
          companies (
            id,
            name,
            company_code
          ),
          roles (
            name
          )
        `)
        .eq("user_id", user.id)

      if (userCompanies) {
        companies = (userCompanies as any[]).map((uc: any) => ({
          id: uc.companies.id,
          name: uc.companies.name,
          plan: uc.companies.company_code || "Enterprise", // Placeholder for plan
          active: uc.active
        }))

        // Collect unique role names
        const rolesList = new Set<string>()
          ; (userCompanies as any[]).forEach((uc: any) => {
            const roleData = uc.roles
            if (Array.isArray(roleData)) {
              roleData.forEach(r => { if (r.name) rolesList.add(r.name.toLowerCase()) })
            } else if (roleData?.name) {
              rolesList.add(roleData.name.toLowerCase())
            }
          })
        userProfile = {
          ...userProfile,
          roles: Array.from(rolesList)
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
      projectId: review.project?.id ?? null,
      projectName: review.project?.name ?? "Untitled project",
    }))

    return NextResponse.json({
      projects: projectList,
      reviews: reviewList,
      user: userProfile,
      companies
    }, { status: 200 })
  } catch (error) {
    console.error("Failed to load sidebar data", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}


