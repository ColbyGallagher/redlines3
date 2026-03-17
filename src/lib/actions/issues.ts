"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export type CreateIssueFromAnnotationsInput = {
    reviewId: string
    projectId: string
    documentId: string
    annotationIds: string[]
    comment?: string | null
    discipline: string
    importance: "High" | "Medium" | "Low"
    pageNumber: number
    userId?: string | null
    state?: string | null
    status?: string | null
    milestone?: string | null
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
function isUuid(val: string) {
    return UUID_REGEX.test(val)
}

export async function createIssueFromAnnotations(data: CreateIssueFromAnnotationsInput) {
    const supabase = await createServerSupabaseClient()

    try {
        // 1. Get next issue number for the project
        const { data: projectIssues, error: countError } = await (supabase
            .from("issues" as any) as any)
            .select("issue_number")
            .eq("project_id", data.projectId)
            .order("issue_number", { ascending: false })
            .limit(1)

        let nextNumber = 1
        if (projectIssues && projectIssues.length > 0) {
            const lastNum = parseInt((projectIssues[0] as any).issue_number.replace(/^\D+/g, ""))
            if (!isNaN(lastNum)) {
                nextNumber = lastNum + 1
            }
        }
        const issueNumber = `I-${nextNumber.toString().padStart(4, "0")}`

        // 2. Insert the issue
        const { data: newIssue, error: issueError } = await (supabase
            .from("issues" as any) as any)
            .insert({
                issue_number: issueNumber,
                comment: data.comment ?? null,
                discipline: isUuid(data.discipline) ? data.discipline : null,
                discipline_old: !isUuid(data.discipline) ? data.discipline : null,
                importance: isUuid(data.importance) ? data.importance : null,
                importance_old: !isUuid(data.importance) ? data.importance : null,
                document_id: data.documentId,
                review_id: data.reviewId,
                project_id: data.projectId,
                page_number: data.pageNumber,
                created_by_user_id: data.userId ?? null,
                state: data.state && isUuid(data.state) ? data.state : null,
                status: data.status && isUuid(data.status) ? data.status : null,
                status_old: data.status && !isUuid(data.status) ? data.status : (data.status ?? "Open"),
                milestone: data.milestone && isUuid(data.milestone) ? data.milestone : null,
                date_created: new Date().toISOString(),
                date_modified: new Date().toISOString(),
            })
            .select()
            .single()

        if (issueError || !newIssue) {
            console.error("Failed to create issue:", issueError)
            return { message: "Failed to create issue: " + issueError?.message }
        }

        // 3. Link annotations to the new issue
        const { error: linkError } = await (supabase
            .from("annotations" as any) as any)
            .update({ issue_id: (newIssue as any).id })
            .in("id", data.annotationIds)

        if (linkError) {
            console.error("Failed to link annotations:", linkError)
            // We don't fail the whole thing, but it's an issue
        }

        revalidateTag("issues")
        revalidateTag("projects")
        revalidatePath(`/projects/${data.projectId}`)
        revalidatePath(`/reviews/${data.reviewId}`)
        return { message: "Success", issue: newIssue }
    } catch (error) {
        console.error("Unexpected error creating issue:", error)
        return { message: "An unexpected error occurred" }
    }
}
