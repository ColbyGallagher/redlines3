import "server-only"

import { NextRequest, NextResponse } from "next/server"

import { createServerSupabaseClient } from "@/lib/supabase/server"

type RouteContext = {
  params: Promise<{ id: string }>
}

export const runtime = "nodejs"

export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  if (!id) {
    return NextResponse.json({ error: "Issue ID is required" }, { status: 400 })
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await (supabase
    .from("issues")
    .select(`
      id, 
      issue_number, 
      discipline, 
      discipline_old,
      importance, 
      importance_old,
      status, 
      status_old,
      date_created, 
      date_modified, 
      project_disciplines!discipline(name),
      project_importances!importance(name),
      project_statuses!status(name),
      created_by_user:users!created_by_user_id(first_name,last_name)
    `)
    .eq("id", id)
    .maybeSingle() as any)

  if (error) {
    console.error("Failed to load issue", error)
    return NextResponse.json({ error: "Failed to load issue" }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Issue not found" }, { status: 404 })
  }

  const createdByUser = data.created_by_user
  const createdBy = createdByUser
    ? `${createdByUser.first_name ?? ""} ${createdByUser.last_name ?? ""}`.trim() || null
    : null

  return NextResponse.json({
    issue: {
      id: data.id,
      issueNumber: data.issue_number ?? null,
      discipline: data.project_disciplines?.name ?? data.discipline_old ?? data.discipline ?? null,
      importance: data.project_importances?.name ?? data.importance_old ?? data.importance ?? null,
      status: data.project_statuses?.name ?? data.status_old ?? data.status ?? null,
      dateCreated: data.date_created ?? null,
      dateModified: data.date_modified ?? null,
      createdBy,
    },
  })
}
