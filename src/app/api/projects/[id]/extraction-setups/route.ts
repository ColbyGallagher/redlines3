import "server-only"

import { NextRequest, NextResponse } from "next/server"

import { getProjectExtractionSetups } from "@/lib/data/projects"

export const runtime = "nodejs"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const extractionSetups = await getProjectExtractionSetups(id)

    if (extractionSetups === undefined) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ extraction_setups: extractionSetups })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
