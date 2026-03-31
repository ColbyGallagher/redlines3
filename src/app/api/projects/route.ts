import "server-only"

import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

import type { Database } from "@/lib/db/types"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { generateSlug } from "@/lib/utils/slug"

const CONTRACT_TYPES = new Set([
  "Concept design",
  "Detailed design",
  "Construction",
])

const PROJECT_STATUSES = new Set(["Planning", "Active", "On hold", "Completed"])

type CreateProjectRequestBody = {
  projectName?: unknown
  projectNumber?: unknown
  projectLocation?: unknown
  status?: unknown
  parentProject?: unknown
  contractType?: unknown
  teamAssignments?: unknown
}

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"]

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

function normalizeContractType(value: unknown) {
  if (typeof value !== "string" || !CONTRACT_TYPES.has(value)) {
    return null
  }

  return value
}

function normalizeStatus(value: unknown) {
  if (typeof value !== "string" || !PROJECT_STATUSES.has(value)) {
    return null
  }

  return value
}

export const runtime = "nodejs"

export async function POST(request: Request) {
  let payload: CreateProjectRequestBody

  try {
    payload = (await request.json()) as CreateProjectRequestBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  try {
    const projectName = normalizeRequiredString(payload.projectName, "Project name")
    const projectNumber = normalizeRequiredString(payload.projectNumber, "Project number")
    const projectLocation = normalizeOptionalString(payload.projectLocation)
    const parentProject = normalizeOptionalString(payload.parentProject)
    const status = normalizeStatus(payload.status)
    const contractType = normalizeContractType(payload.contractType)

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "You must be signed in to create a project." }, { status: 401 })
    }

    // Get the user's current/primary company
    const { data: userCompany, error: companyError } = await (supabase as any)
      .from("user_companies")
      .select("company_id")
      .eq("user_id", user.id)
      .eq("active", true)
      .maybeSingle()

    if (companyError || !userCompany) {
      return NextResponse.json({ error: "No active organization found for this user." }, { status: 400 })
    }

    const projectId = crypto.randomUUID()
    const slug = generateSlug(projectName, projectId, "project")

    const insertPayload: any = {
      id: projectId,
      slug,
      project_name: projectName,
      project_number: projectNumber,
      project_location: projectLocation,
      parent_project: parentProject,
      status,
      contract_type: contractType,
      company_id: userCompany.company_id,
    }

    // TODO: replace with typed insert once Supabase schema typings are fully defined.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from("projects") as any)
      .insert(insertPayload)
      .select()
      .single()

    if (error) {
      console.error("Supabase insert error", {
        error,
        payload: insertPayload,
      })
      throw new Error(error.message)
    }

    const project = (data ?? null) as ProjectRow | null
    if (!project) {
      throw new Error("Project was not returned from Supabase")
    }

    revalidateTag("projects")
    revalidatePath("/projects")

    return NextResponse.json({ project })
  } catch (error) {
    console.error("Project creation failed", error)
    const message = error instanceof Error ? error.message : "Failed to create project"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
