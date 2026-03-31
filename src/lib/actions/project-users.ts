"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { toTitleCaseFallback } from "@/lib/utils/user-utils"
import type { ReviewUser } from "@/lib/data/reviews"

export type ProjectUserState = {
    success?: boolean
    message?: string
}

export async function addProjectUsers(
    projectId: string,
    users: { user_id: string; role: string }[]
): Promise<ProjectUserState> {
    const supabase = await createServerSupabaseClient()

    try {
        const insertData = users.map(user => ({
            project_id: projectId,
            user_id: user.user_id,
            role: user.role,
        }))

        const { error } = await (supabase.from("project_users") as any).insert(insertData)

        if (error) {
            console.error("Failed to add project users:", error)
            return { success: false, message: "Failed to add users: " + error.message }
        }

        revalidatePath(`/projects/${projectId}/settings`)

        return { success: true, message: "Users added to project successfully." }
    } catch (error) {
        console.error("Unexpected error adding project users:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

export async function removeProjectUser(
    projectId: string,
    userId: string,
    reassignToUserId?: string
): Promise<ProjectUserState> {
    const supabase = await createServerSupabaseClient()

    try {
        // 1. Reassign issues if needed
        if (reassignToUserId) {
            const { error: reassignError } = await (supabase.from("issues") as any)
                .update({ created_by_user_id: reassignToUserId })
                .eq("project_id", projectId)
                .eq("created_by_user_id", userId)

            if (reassignError) {
                console.error("Failed to reassign issues:", reassignError)
                return { success: false, message: "Failed to reassign issues: " + reassignError.message }
            }
        }

        // 2. Remove from project_users
        const { error } = await (supabase.from("project_users") as any)
            .delete()
            .eq("project_id", projectId)
            .eq("user_id", userId)

        if (error) {
            console.error("Failed to remove project user:", error)
            return { success: false, message: "Failed to remove user: " + error.message }
        }

        revalidatePath(`/projects/${projectId}/settings`)

        return { success: true, message: "User removed from project." }
    } catch (error) {
        console.error("Unexpected error removing project user:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

export async function updateProjectUserRole(
    projectId: string,
    userId: string,
    role: string
): Promise<ProjectUserState> {
    const supabase = await createServerSupabaseClient()

    try {
        const { error } = await (supabase.from("project_users") as any)
            .update({ role: role })
            .eq("project_id", projectId)
            .eq("user_id", userId)

        if (error) {
            console.error("Failed to update project user role:", error)
            return { success: false, message: "Failed to update role: " + error.message }
        }

        revalidatePath(`/projects/${projectId}/settings`)

        return { success: true, message: "User role updated." }
    } catch (error) {
        console.error("Unexpected error updating project user role:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

export async function bulkUpdateProjectUserRoles(
    projectId: string,
    userIds: string[],
    role: string
): Promise<ProjectUserState> {
    const supabase = await createServerSupabaseClient()

    try {
        const { error } = await (supabase.from("project_users") as any)
            .update({ role: role })
            .eq("project_id", projectId)
            .in("user_id", userIds)

        if (error) {
            console.error("Failed to bulk update project user roles:", error)
            return { success: false, message: "Failed to bulk update roles: " + error.message }
        }

        revalidatePath(`/projects/${projectId}/settings`)

        return { success: true, message: `Updated roles for ${userIds.length} users.` }
    } catch (error) {
        console.error("Unexpected error bulk updating project user roles:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

export async function bulkRemoveProjectUsers(
    projectId: string,
    userIds: string[],
    reassignToUserId?: string
): Promise<ProjectUserState> {
    const supabase = await createServerSupabaseClient()

    try {
        // 1. Reassign issues if needed
        if (reassignToUserId) {
            const { error: reassignError } = await (supabase.from("issues") as any)
                .update({ created_by_user_id: reassignToUserId })
                .eq("project_id", projectId)
                .in("created_by_user_id", userIds)

            if (reassignError) {
                console.error("Failed to reassign issues for bulk removal:", reassignError)
                return { success: false, message: "Failed to reassign issues: " + reassignError.message }
            }
        }

        // 2. Remove from project_users
        const { error } = await (supabase.from("project_users") as any)
            .delete()
            .eq("project_id", projectId)
            .in("user_id", userIds)

        if (error) {
            console.error("Failed to bulk remove project users:", error)
            return { success: false, message: "Failed to remove users: " + error.message }
        }

        revalidatePath(`/projects/${projectId}/settings`)

        return { success: true, message: `Removed ${userIds.length} users from project.` }
    } catch (error) {
        console.error("Unexpected error bulk removing project users:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

export async function getProjectMemberIssueCount(projectId: string, userIds: string | string[]): Promise<number> {
    const supabase = await createServerSupabaseClient()
    const ids = Array.isArray(userIds) ? userIds : [userIds]
    
    try {
        const { count, error } = await (supabase.from("issues") as any)
            .select("*", { count: "exact", head: true })
            .eq("project_id", projectId)
            .in("created_by_user_id", ids)
            
        if (error) {
            console.error("Failed to fetch project member issue count:", error)
            return 0
        }
        
        return count || 0
    } catch (error) {
        console.error("Error checking project member issue count:", error)
        return 0
    }
}

export async function getAllGlobalUsers(): Promise<ReviewUser[]> {
    try {
        const supabase = await createServerSupabaseClient()

        const { data, error } = await (supabase.from("users") as any)
            .select(`
                *,
                user_companies!inner (
                    active,
                    companies (
                        name
                    )
                )
            `)
            .order("first_name")

        if (error) {
            console.error("Failed to fetch global users:", error)
            throw new Error(error.message)
        }

        return (data || []).map((user: any) => {
            const activeCompany = user.user_companies?.find((uc: any) => uc.active) || user.user_companies?.[0]
            
            return {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                jobTitle: user.job_title ?? "",
                role: "Reviewer",
                avatarFallback: toTitleCaseFallback(user.first_name, user.last_name),
                company: activeCompany?.companies?.name ?? "Independent",
                status: "Active",
            }
        })
    } catch (error) {
        throw new Error(
            `Failed to fetch users: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
    }
}
