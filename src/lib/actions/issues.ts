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
        revalidatePath('/reviews', 'layout')
        return { message: "Success", issue: newIssue }
    } catch (error) {
        console.error("Unexpected error creating issue:", error)
        return { message: "An unexpected error occurred" }
    }
}

import type { Issue } from "@/lib/db/types"

export async function updateIssue(issueId: string, projectId: string, updates: Partial<Issue>) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    try {
        // 1. Get the current issue state and the user's role in the project
        const { data: issue, error: issueError } = await (supabase.from("issues" as any) as any)
            .select("state, review_id, created_by_user_id")
            .eq("id", issueId)
            .single()

        if (issueError || !issue) {
            throw new Error("Issue not found")
        }

        const { data: projectMember, error: memberError } = await (supabase.from("project_users" as any) as any)
            .select("role")
            .eq("project_id", projectId)
            .eq("user_id", user.id)
            .maybeSingle()

        if (memberError) throw memberError

        let userRole = (projectMember as any)?.role?.toLowerCase() || "viewer"
        const adminRoles = ["admin", "project admin", "organization admin", "org admin", "developer"]
        let isSystemAdmin = adminRoles.includes(userRole)

        // If not a project admin, check for global organization roles
        if (!isSystemAdmin) {
            const { data: orgRoles } = await (supabase.from("user_companies" as any) as any)
                .select(`roles:role_id (name)`)
                .eq("user_id", user.id)
                .eq("active", true)
            
            const globalRoles = (orgRoles || []).map((uc: any) => uc.roles?.name?.toLowerCase()).filter(Boolean)
            if (globalRoles.includes('org admin') || globalRoles.includes('admin') || globalRoles.includes('developer')) {
                isSystemAdmin = true
                userRole = globalRoles.includes('developer') ? 'developer' : 'admin'
            }
        }

        // 2. Check permissions for the current review phase
        // Get the review's current phase link
        const { data: review, error: reviewError } = await (supabase.from("reviews" as any) as any)
            .select("phase_id, specific_status")
            .eq("id", (issue as any).review_id || "")
            .single()

        if (!reviewError && review) {
            let phaseData = null
            let phaseError = null

            // Prioritize direct phase_id link
            if ((review as any).phase_id) {
                const res = await (supabase.from("project_review_phases" as any) as any)
                    .select("permissions")
                    .eq("id", (review as any).phase_id)
                    .maybeSingle()
                phaseData = res.data
                phaseError = res.error
            } 
            // Fallback to name-based lookup if phase_id is not set (legacy or during migration)
            else if ((review as any).specific_status) {
                const res = await (supabase.from("project_review_phases" as any) as any)
                    .select("permissions")
                    .eq("project_id", projectId)
                    .eq("phase_name", (review as any).specific_status)
                    .maybeSingle()
                phaseData = res.data
                phaseError = res.error
            }

            if (!phaseError && phaseData) {
                const phasePerms = (phaseData as any).permissions || {}
                const rolePerms = phasePerms[userRole] || phasePerms[userRole.replace(" ", "_")] || []

                if (!isSystemAdmin) {
                    const canEditOthers = rolePerms.includes("edit_others")
                    const canEditOwn = rolePerms.includes("edit_own")

                    if (!canEditOthers) {
                        if (canEditOwn) {
                            if ((issue as any).created_by_user_id !== user.id) {
                                throw new Error(`Unauthorized: You can only edit your own issues during the ${ (review as any).specific_status } phase.`)
                            }
                        } else {
                            throw new Error(`Unauthorized: Your role cannot edit issues during the ${ (review as any).specific_status } phase.`)
                        }
                    }
                }
            }
        }

        // 3. Fallback: check permissions for the issue status if no phase matches
        if (issue.state) {
            const { data: stateData, error: stateError } = await (supabase.from("project_states" as any) as any)
                .select("allowed_roles")
                .eq("id", issue.state)
                .single()

            if (!stateError && stateData) {
                const allowedRoles = (stateData as any).allowed_roles || ["admin"]
                if (!isSystemAdmin && !allowedRoles.map((r: string) => r.toLowerCase()).includes(userRole)) {
                    throw new Error("Unauthorized: Your role cannot edit issues in this state.")
                }
            }
        }

        // 3. Perform the update
        const { error: updateError } = await (supabase.from("issues" as any) as any)
            .update({
                ...updates,
                date_modified: new Date().toISOString(),
                modified_by_user_id: user.id
            })
            .eq("id", issueId)

        if (updateError) throw updateError

        revalidateTag("issues")
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error) {
        console.error("Error updating issue:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to update issue" }
    }
}

export async function bulkUpdateIssues(issueIds: string[], projectId: string, updates: Partial<Issue>) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    try {
        // 1. Get user role
        const { data: projectMember, error: memberError } = await (supabase.from("project_users" as any) as any)
            .select("role")
            .eq("project_id", projectId)
            .eq("user_id", user.id)
            .maybeSingle()

        if (memberError) throw memberError

        let userRole = (projectMember as any)?.role?.toLowerCase() || "viewer"
        const adminRoles = ["admin", "project admin", "organization admin", "org admin", "developer"]
        let isSystemAdmin = adminRoles.includes(userRole)

        // If not a project admin, check for global organization roles
        if (!isSystemAdmin) {
            const { data: orgRoles } = await (supabase.from("user_companies" as any) as any)
                .select(`roles:role_id (name)`)
                .eq("user_id", user.id)
                .eq("active", true)
            
            const globalRoles = (orgRoles || []).map((uc: any) => uc.roles?.name?.toLowerCase()).filter(Boolean)
            if (globalRoles.includes('org admin') || globalRoles.includes('admin') || globalRoles.includes('developer')) {
                isSystemAdmin = true
                userRole = globalRoles.includes('developer') ? 'developer' : 'admin'
            }
        }

        if (isSystemAdmin) {
            // Bulk update for admins
            const { error: updateError } = await (supabase.from("issues" as any) as any)
                .update({
                    ...updates,
                    date_modified: new Date().toISOString(),
                    modified_by_user_id: user.id
                })
                .in("id", issueIds)
                .eq("project_id", projectId)

            if (updateError) throw updateError
        } else {
            // Per-issue checks for non-admins
            // For now, to keep it simple and safe, we'll call updateIssue per item
            // This ensures all complex phase-based permission logic is applied
            const results = await Promise.all(issueIds.map(id => updateIssue(id, projectId, updates)))
            const failures = results.filter(r => !r.success)
            if (failures.length > 0) {
                return { 
                    success: false, 
                    error: `${failures.length} issues could not be updated due to permission restrictions or errors.` 
                }
            }
        }

        revalidateTag("issues")
        revalidatePath(`/projects/${projectId}`)
        return { success: true }
    } catch (error) {
        console.error("Error in bulk update:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to perform bulk update" }
    }
}

export async function uploadIssueSnapshot(
    issueId: string,
    projectId: string,
    reviewId: string,
    formData: FormData
) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    try {
        const file = formData.get("file") as File
        if (!file) {
            throw new Error("No file uploaded")
        }

        const filePath = `${projectId}/${reviewId}/${issueId}-snapshot.jpg`

        // 1. Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
            .from("issue-snapshots")
            .upload(filePath, file, {
                contentType: "image/jpeg",
                upsert: true,
            })

        if (uploadError) {
            console.error("Storage upload failed:", uploadError)
            return { success: false, error: "Failed to upload snapshot to storage" }
        }

        // 2. Update the issue record
        const { error: updateError } = await (supabase.from("issues" as any) as any)
            .update({ snapshot_path: filePath })
            .eq("id", issueId)

        if (updateError) {
            console.error("Issue update failed:", updateError)
            return { success: false, error: "Failed to link snapshot to issue" }
        }

        revalidateTag("issues")
        revalidatePath(`/projects/${projectId}`)
        revalidatePath('/reviews', 'layout')

        return { success: true }
    } catch (error) {
        console.error("Error uploading snapshot:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unexpected error uploading snapshot" }
    }
}

