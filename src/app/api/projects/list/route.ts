import "server-only"

import { NextResponse } from "next/server"

import { getProjectSummaries } from "@/lib/data/projects"

export const runtime = "nodejs"

export async function GET() {
  try {
    const summaries = await getProjectSummaries()
    const projects = summaries.map((summary) => ({
      id: summary.project.id,
      name: summary.project.projectName,
      number: summary.project.projectNumber,
      location: summary.project.projectLocation,
      metrics: summary.metrics,
      lastUpdated: summary.lastUpdated,
    }))

    return NextResponse.json({ projects })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

