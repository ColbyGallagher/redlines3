import "server-only"

import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

import type { Database } from "@/lib/db/types"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { generateSlug } from "@/lib/utils/slug"

type CreateReviewRequestBody = {
  reviewName?: unknown
  reviewNumber?: unknown
  milestone?: unknown
  dueDateSmeReview?: unknown
  dueDateIssueComments?: unknown
  dueDateReplies?: unknown
  projectId?: unknown
  workflowId?: unknown
  documents?: { name: string; size: number }[]
}

function normalizeRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    throw new Error(`${fieldName} is required`)
  }

  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(`${fieldName} is required`)
  }

  return trimmed
}

function normalizeOptionalString(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

function normalizeOptionalDate(value: unknown) {
  if (typeof value !== "string") {
    return null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${trimmed}`)
  }

  return date.toISOString().slice(0, 10)
}

export const runtime = "nodejs"

export async function POST(request: Request) {
  let payload: CreateReviewRequestBody

  try {
    payload = (await request.json()) as CreateReviewRequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const reviewName = normalizeRequiredString(payload.reviewName, "Review name")
    const projectId = normalizeRequiredString(payload.projectId, "Project")
    const reviewNumber = normalizeOptionalString(payload.reviewNumber)
    const milestone = normalizeOptionalString(payload.milestone)
    const dueDateSmeReview = normalizeOptionalDate(payload.dueDateSmeReview)
    const dueDateIssueComments = normalizeOptionalDate(payload.dueDateIssueComments)
    const dueDateReplies = normalizeOptionalDate(payload.dueDateReplies)
    const workflowId = normalizeOptionalString(payload.workflowId)

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "You must be signed in to create a review." }, { status: 401 })
    }

    // Role check: Admin or Developer role required (either project-level or global)
    const { data: memberData } = await (supabase.from("project_users") as any)
      .select("role")
      .eq("project_id", projectId)
      .eq("user_id", user.id)
      .maybeSingle()

    const projectRole = (memberData as any)?.role?.toLowerCase()

    const { data: orgRoles } = await (supabase.from("user_companies") as any)
      .select(`
        roles:role_id (
          name
        )
      `)
      .eq("user_id", user.id)
      .eq("active", true)

    const globalRoles = (orgRoles || []).map((uc: any) => uc.roles?.name?.toLowerCase()).filter(Boolean)
    const isGlobalAuthorized = globalRoles.includes('org admin') || globalRoles.includes('admin') || globalRoles.includes('developer')

    const allowedProjectRoles = ["admin", "developer"]
    if (!isGlobalAuthorized && !allowedProjectRoles.includes(projectRole)) {
      return NextResponse.json({ error: "Unauthorized. Admin or Developer role required to create a review." }, { status: 403 })
    }

    // Generate a deterministic slug from the review name + a fresh UUID
    const reviewId = crypto.randomUUID()
    const slug = generateSlug(reviewName, reviewId, "review")

    const now = new Date()
    const startDate = now.toISOString()
    const insertPayload: Database["public"]["Tables"]["reviews"]["Insert"] = {
      id: reviewId,
      slug,
      review_name: reviewName,
      review_number: reviewNumber,
      milestone,
      due_date_sme_review: dueDateSmeReview,
      due_date_issue_comments: dueDateIssueComments,
      due_date_replies: dueDateReplies,
      project_id: projectId,
      state: "Active",
      specific_status: "In Progress",
      start_date: startDate,
    }

    // TODO: replace with typed insert once Supabase schema typings are fully defined.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("reviews") as any)
      .insert(insertPayload)
      .select("id, slug")
      .single()

    if (error) {
      console.error("Supabase insert error (review)", {
        error,
        payload: {
          reviewName,
          reviewNumber,
          milestone,
          dueDateSmeReview,
          dueDateIssueComments,
          dueDateReplies,
          projectId,
        },
      })
      throw new Error(error.message)
    }

    // Seed review phases based on project defaults
    let phasesQuery = (supabase.from("project_review_phases") as any)
      .select("*")
      .eq("project_id", projectId)

    if (workflowId) {
      phasesQuery = phasesQuery.eq("workflow_id", workflowId)
    } else {
      // Fallback: use the first workflow if not specified
      const { data: workflows } = await (supabase.from("project_workflows") as any)
        .select("id")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true })
        .limit(1) as { data: { id: string }[] | null }
      
      if (workflows && workflows.length > 0) {
        phasesQuery = phasesQuery.eq("workflow_id", workflows[0].id)
      }
    }

    const { data: projectPhases } = await phasesQuery.order("order_index", { ascending: true })

    if (projectPhases && projectPhases.length > 0) {
      let cumulativeDays = 0
      const reviewPhasesPayload = projectPhases.map((phase: any) => {
        cumulativeDays += (phase.duration_days || 0)
        const phaseDueDate = new Date(now)
        phaseDueDate.setDate(phaseDueDate.getDate() + cumulativeDays)
        
        return {
          review_id: reviewId,
          name: phase.phase_name,
          due_date: phaseDueDate.toISOString(),
          status: "Pending",
        }
      })

      const { error: phaseError } = await (supabase.from("review_phases") as any).insert(reviewPhasesPayload)
      if (phaseError) {
        console.error("Supabase insert error (review_phases)", phaseError)
      }
    }

    if (payload.documents && Array.isArray(payload.documents) && payload.documents.length > 0) {
      const documentsPayload = payload.documents.map((doc) => ({
        document_name: doc.name,
        file_size: doc.size.toString(), // Storing size as string based on usage in other files
        project_id: projectId,
        review_id: data.id,
        status: "uploaded", // Default status
        uploaded_at: new Date().toISOString(),
      }))

      // TODO: replace with typed insert once Supabase schema typings are fully defined.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: docError } = await (supabase.from("documents") as any).insert(documentsPayload)

      if (docError) {
        console.error("Supabase insert error (documents)", docError)
        // We log but don't fail the request if documents fail, or we could throw. 
        // For now, let's log.
      }
    }

    revalidateTag("reviews")
    revalidateTag("projects")
    revalidatePath("/dashboard")
    revalidatePath(`/projects/${projectId}`)

    return NextResponse.json({ review: data })
  } catch (error) {
    console.error("Review creation failed", error)
    const message = error instanceof Error ? error.message : "Failed to create review"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
