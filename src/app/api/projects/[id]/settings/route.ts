import "server-only"

import { NextRequest, NextResponse } from "next/server"

import { getProjectSummaryById, updateProjectSettings } from "@/lib/data/projects"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const summary = await getProjectSummaryById(id)

    if (!summary) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ settings: summary.settings })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const { settings } = await request.json()

    if (!settings) {
      return NextResponse.json({ error: "Settings are required" }, { status: 400 })
    }

    await updateProjectSettings(id, settings)

    return NextResponse.json({ success: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

