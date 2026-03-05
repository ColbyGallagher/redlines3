import "server-only"

import { NextRequest, NextResponse } from "next/server"

import { updateProjectMilestones } from "@/lib/data/projects"

export const runtime = "nodejs"

type RouteContext = {
    params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, context: RouteContext) {
    try {
        const { id } = await context.params
        const { availableMilestones, selectedMilestones } = await request.json()

        if (!availableMilestones || !selectedMilestones) {
            return NextResponse.json({ error: "Milestone data is required" }, { status: 400 })
        }

        await updateProjectMilestones(id, availableMilestones, selectedMilestones)

        return NextResponse.json({ success: true })
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error"
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
