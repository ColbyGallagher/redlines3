import "server-only"

import { NextResponse } from "next/server"

import { getProjectSummaryById } from "@/lib/data/projects"

export const runtime = "nodejs"

type RouteParams = {
  params: {
    id: string
  }
}

export async function GET(_: Request, { params }: RouteParams) {
  try {
    const summary = await getProjectSummaryById(params.id)

    if (!summary) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ settings: summary.settings })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

