import "server-only"

import { NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"

import { createServerSupabaseClient } from "@/lib/supabase/server"

type CreateIssueRequestBody = {
    projectId?: unknown
    reviewId?: unknown
    discipline?: unknown
    importance?: unknown
    milestone?: unknown
    state?: unknown
    status?: unknown
    package?: unknown
    documentId?: unknown
    reviewers_name?: unknown
    classification?: unknown
    comment?: unknown
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
    if (typeof value !== "string") return null
    const trimmed = value.trim()
    return trimmed.length ? trimmed : null
}

export const runtime = "nodejs"

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get("documentId")

    if (!documentId) {
        return NextResponse.json({ error: "documentId is required" }, { status: 400 })
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
            comment,
            date_created, 
            date_modified, 
            project_disciplines!discipline(name),
            project_importances!importance(name),
            project_statuses!status(name),
            created_by_user:users!created_by_user_id(first_name,last_name)
        `)
        .eq("document_id", documentId) as any)

    if (error) {
        console.error("Failed to load issues for document", error)
        return NextResponse.json({ error: "Failed to load issues" }, { status: 500 })
    }

    const issues = (data || []).map((item: any) => {
        const createdByUser = item.created_by_user
        const createdBy = createdByUser
            ? `${createdByUser.first_name ?? ""} ${createdByUser.last_name ?? ""}`.trim() || null
            : null

        return {
            id: item.id,
            issueNumber: item.issue_number ?? null,
            discipline: item.project_disciplines?.name ?? item.discipline_old ?? item.discipline ?? null,
            importance: item.project_importances?.name ?? item.importance_old ?? item.importance ?? null,
            status: item.project_statuses?.name ?? item.status_old ?? item.status ?? null,
            comment: item.comment ?? null,
            dateCreated: item.date_created ?? null,
            dateModified: item.date_modified ?? null,
            createdBy,
        }
    })

    return NextResponse.json({ issues })
}

export async function POST(request: Request) {
    let payload: CreateIssueRequestBody

    try {
        payload = (await request.json()) as CreateIssueRequestBody
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    try {
        const projectId = normalizeRequiredString(payload.projectId, "Project")
        const reviewId = normalizeRequiredString(payload.reviewId, "Review")
        const discipline = normalizeRequiredString(payload.discipline, "Discipline")
        const importance = normalizeRequiredString(payload.importance, "Importance")
        const milestone = normalizeOptionalString(payload.milestone)
        const state = normalizeOptionalString(payload.state)
        const status = normalizeOptionalString(payload.status) ?? "Open"
        const packageId = normalizeOptionalString(payload.package)
        const documentId = normalizeOptionalString(payload.documentId)
        const reviewersName = normalizeOptionalString(payload.reviewers_name)
        const classification = normalizeOptionalString(payload.classification)
        const comment = normalizeOptionalString(payload.comment)

        const supabase = await createServerSupabaseClient()

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "You must be signed in to create an issue." }, { status: 401 })
        }

        // Determine next issue number for this project
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: existingIssues } = await (supabase.from("issues") as any)
            .select("issue_number")
            .eq("project_id", projectId)
            .order("issue_number", { ascending: false })
            .limit(1)

        let nextNumber = 1
        if (existingIssues && existingIssues.length > 0) {
            const lastNum = parseInt((existingIssues[0] as { issue_number: string }).issue_number.replace(/^\D+/g, ""))
            if (!Number.isNaN(lastNum)) {
                nextNumber = lastNum + 1
            }
        }
        const issueNumber = `I-${nextNumber.toString().padStart(4, "0")}`

        const now = new Date().toISOString()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase.from("issues") as any)
            .insert({
                issue_number: issueNumber,
                project_id: projectId,
                review_id: reviewId,
                discipline,
                importance,
                comment,
                status,
                milestone,
                state,
                package: packageId,
                document_id: documentId,
                document_number: documentId,
                document_title: documentId,
                reviewers_name: reviewersName,
                classification: classification,
                date_created: now,
                date_modified: now,
            })
            .select("id")
            .single()

        if (error) {
            console.error("Supabase insert error (issue)", error)
            throw new Error(error.message)
        }

        revalidateTag("issues")
        revalidateTag("projects")
        revalidatePath(`/projects/${projectId}`)

        return NextResponse.json({ issue: data })
    } catch (error) {
        console.error("Issue creation failed", error)
        const message = error instanceof Error ? error.message : "Failed to create issue"
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
