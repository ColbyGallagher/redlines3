import "server-only"

import { NextResponse } from "next/server"

import { createIssueFromAnnotations } from "@/lib/actions/issues"

type ConvertAnnotationRequestBody = {
    projectId?: unknown
    reviewId?: unknown
    documentId?: unknown
    annotationIds?: unknown
    discipline?: unknown
    importance?: unknown
    comment?: unknown
    pageNumber?: unknown
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

function normalizeAnnotationIds(value: unknown) {
    if (!Array.isArray(value) || value.length === 0) {
        throw new Error("Annotation IDs are required")
    }

    const ids = value.map((id) => {
        if (typeof id !== "string") {
            throw new Error("Annotation IDs must be strings")
        }

        const trimmed = id.trim()
        if (!trimmed) {
            throw new Error("Annotation IDs must be non-empty")
        }

        return trimmed
    })

    return ids
}

function normalizePageNumber(value: unknown) {
    if (typeof value === "number") {
        if (Number.isNaN(value) || value <= 0) {
            throw new Error("Page number is required")
        }
        return value
    }

    if (typeof value === "string") {
        const parsed = Number(value)
        if (Number.isNaN(parsed) || parsed <= 0) {
            throw new Error("Page number is required")
        }
        return parsed
    }

    throw new Error("Page number is required")
}

export const runtime = "nodejs"

export async function POST(request: Request) {
    let payload: ConvertAnnotationRequestBody

    try {
        payload = (await request.json()) as ConvertAnnotationRequestBody
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
    }

    try {
        const projectId = normalizeRequiredString(payload.projectId, "Project")
        const reviewId = normalizeRequiredString(payload.reviewId, "Review")
        const documentId = normalizeRequiredString(payload.documentId, "Document")
        const discipline = normalizeRequiredString(payload.discipline, "Discipline")
        const importance = normalizeRequiredString(payload.importance, "Importance")
        const annotationIds = normalizeAnnotationIds(payload.annotationIds)
        const pageNumber = normalizePageNumber(payload.pageNumber)
        const comment = normalizeOptionalString(payload.comment)

        const result = await createIssueFromAnnotations({
            projectId,
            reviewId,
            documentId,
            annotationIds,
            discipline,
            importance: importance as "High" | "Medium" | "Low",
            comment,
            pageNumber,
        })

        if (result.message !== "Success" || !result.issue) {
            return NextResponse.json({ error: result.message || "Failed to convert annotation to issue" }, { status: 400 })
        }

        return NextResponse.json({ issue: result.issue })
    } catch (error) {
        console.error("Failed to convert annotation to issue", error)
        const message = error instanceof Error ? error.message : "Failed to convert annotation to issue"
        return NextResponse.json({ error: message }, { status: 400 })
    }
}
