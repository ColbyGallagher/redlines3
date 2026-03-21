"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database, ProjectReviewPhase } from "@/lib/db/types"
import { formatName, toTitleCaseFallback } from "@/lib/utils/user-utils"
import type { ReviewUser } from "@/lib/data/reviews"

export type AddReviewerState = {
    success?: boolean
    message?: string
}

export async function addReviewers(
    reviewId: string,
    userIds: string[],
    role: string = "Reviewer"
): Promise<AddReviewerState> {
    const supabase = await createServerSupabaseClient()

    try {
        const insertData = userIds.map(userId => ({
            review_id: reviewId,
            user_id: userId,
            role: role,
        }))

        const { error } = await (supabase.from("review_users") as any).insert(insertData)

        if (error) {
            console.error("Failed to add reviewers:", error)
            return { success: false, message: "Failed to add reviewers: " + error.message }
        }

        revalidatePath(`/reviews/${reviewId}`)

        return { success: true, message: "Reviewer added successfully." }
    } catch (error) {
        console.error("Unexpected error adding reviewer:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

export async function getAllUsers(): Promise<ReviewUser[]> {
    try {
        const supabase = await createServerSupabaseClient()

        const { data, error } = await (supabase.from("users") as any)
            .select("*")
            .order("first_name")

        if (error) {
            throw new Error(error.message)
        }

        return (data || []).map((user: any) => ({
            id: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            jobTitle: user.job_title ?? "",
            role: "Reviewer",
            avatarFallback: toTitleCaseFallback(user.first_name, user.last_name),
            company: "ColbyGallagher",
            status: "Active",
        }))
    } catch (error) {
        throw new Error(
            `Failed to fetch users: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
    }
}
export async function updateReviewLifecycle(
    reviewId: string,
    projectId: string,
    payload: { state?: string; status?: string; specificStatus?: string; phaseId?: string; milestone?: string; dueDate?: string }
): Promise<{ success: boolean; message: string }> {
    const supabase = await createServerSupabaseClient()

    try {
        // 1. Verify roles
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user) {
            return { success: false, message: "Authentication required." }
        }

        const { data: memberData, error: memberError } = await (supabase.from("project_users") as any)
            .select("role")
            .eq("project_id", projectId)
            .eq("user_id", userData.user.id)
            .single()

        const projectRole = (memberData as any)?.role?.toLowerCase()
        
        const { data: orgRoles, error: orgRolesError } = await (supabase.from("user_companies") as any)
            .select(`
                roles:role_id (
                    name
                )
            `)
            .eq("user_id", userData.user.id)
            .eq("active", true)

        const globalRoles = (orgRoles || []).map((uc: any) => uc.roles?.name?.toLowerCase()).filter(Boolean)
        const isGlobalAuthorized = globalRoles.includes('org admin') || globalRoles.includes('admin') || globalRoles.includes('developer')

        if (memberError && !isGlobalAuthorized) {
            return { success: false, message: "Unauthorized. Role required." }
        }

        const allowedProjectRoles = ["admin", "developer"]
        if (!isGlobalAuthorized && !allowedProjectRoles.includes(projectRole)) {
            return { success: false, message: "Unauthorized. Admin or Developer role required." }
        }

        // 2. Perform update
        const updatePayload: any = {}
        if (payload.state !== undefined) updatePayload.state = payload.state
        if (payload.status !== undefined) updatePayload.status = payload.status
        if (payload.specificStatus !== undefined) updatePayload.specific_status = payload.specificStatus
        if (payload.milestone !== undefined) updatePayload.milestone = payload.milestone
        
        // Handle phaseId update and sync specific_status
        if (payload.phaseId !== undefined) {
            updatePayload.phase_id = payload.phaseId
            
            // Fetch the phase name to keep specific_status in sync
            if (payload.phaseId) {
                const { data: phase } = await (supabase.from("project_review_phases") as any)
                    .select("phase_name, state")
                    .eq("id", payload.phaseId)
                    .single()
                
                if (phase) {
                    updatePayload.specific_status = (phase as any).phase_name
                    updatePayload.state = (phase as any).state
                }
            } else {
                updatePayload.specific_status = null
            }
        }

        // When updating due date from overview, update all relevant columns to ensure visibility
        if (payload.dueDate !== undefined) {
            updatePayload.due_date_sme_review = payload.dueDate
            updatePayload.due_date_issue_comments = payload.dueDate
            updatePayload.due_date_replies = payload.dueDate
        }

        const { data: updateData, error: updateError } = await (supabase.from("reviews") as any)
            .update(updatePayload)
            .eq("id", reviewId)
            .select()

        if (updateError) {
            console.error("Failed to update review lifecycle:", updateError)
            return { success: false, message: "Failed to update review: " + updateError.message }
        }

        if (!updateData || updateData.length === 0) {
            console.error(`Update silently failed for review ID ${reviewId}. Possible RLS block.`)
            return { success: false, message: "Failed to update review: Permission denied." }
        }

        revalidatePath(`/projects/${projectId}`)
        revalidatePath(`/reviews/${reviewId}`)

        return { success: true, message: "Review updated successfully." }
    } catch (error) {
        console.error("Unexpected error updating review lifecycle:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

export type ReviewTimelineProgress = {
    startDate: string
    phases: ProjectReviewPhase[]
}

export async function getReviewTimelineProgress(reviewId: string): Promise<ReviewTimelineProgress> {
    const supabase = await createServerSupabaseClient()

    try {
        // 1. Get review start_date and project_id
        const { data: reviewData, error: reviewError } = await (supabase.from("reviews") as any)
            .select("start_date, project_id")
            .eq("id", reviewId)
            .single()

        if (reviewError || !reviewData) {
            console.error("Failed to fetch review for timeline:", reviewError)
            throw new Error("Failed to fetch review data")
        }

        // 2. Get project phases
        const { data: phaseData, error: phaseError } = await (supabase.from("project_review_phases") as any)
            .select("*")
            .eq("project_id", reviewData.project_id)
            .order("order_index", { ascending: true })

        if (phaseError) {
            console.error("Failed to fetch project phases:", phaseError)
            throw new Error("Failed to fetch project phases")
        }

        return {
            startDate: reviewData.start_date || new Date().toISOString(),
            phases: phaseData || [],
        }
    } catch (error) {
        console.error("Unexpected error fetching review timeline progress:", error)
        throw new Error("Failed to fetch review timeline progress")
    }
}
