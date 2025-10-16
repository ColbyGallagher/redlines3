import "server-only"

import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

import type { Database } from "@/lib/db/types"
import { createServerSupabaseClient } from "@/lib/supabase/server"

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

type ProjectRow = Database["redlines"]["Tables"]["projects"]["Row"]

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

    const supabase = await createServerSupabaseClient<Database>()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "You must be signed in to create a project." }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        project_name: projectName,
        project_number: projectNumber,
        project_location: projectLocation,
        parent_project: parentProject,
        status,
        contract_type: contractType,
      })
      .select()
      .single<ProjectRow>()

    if (error) {
      console.error("Supabase insert error", {
        error,
        payload: {
          projectName,
          projectNumber,
          projectLocation,
          parentProject,
          status,
          contractType,
        },
      })
      throw new Error(error.message)
    }

    revalidateTag("projects")
    revalidatePath("/projects")

    return NextResponse.json({ project: data })
  } catch (error) {
    console.error("Project creation failed", error)
    const message = error instanceof Error ? error.message : "Failed to create project"
    return NextResponse.json({ error: message }, { status: 400 })
  }
}


