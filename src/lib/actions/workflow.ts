"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { ProjectReviewPhase } from "@/lib/db/types"

async function checkAdminPrivileges(projectId: string) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // Check project-specific role or organization role
    const { data: projectMember } = await supabase
        .from("project_users")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle() as any

    const { data: project } = await supabase
        .from("projects")
        .select("company_id")
        .eq("id", projectId)
        .single() as any

    let orgRole = null
    if (project?.company_id) {
        const { data: userCompany } = await supabase
            .from("user_companies")
            .select(`
                roles (
                    name
                )
            `)
            .eq("user_id", user.id)
            .eq("company_id", project.company_id)
            .maybeSingle() as any
        
        if (userCompany?.roles) {
            orgRole = userCompany.roles?.name
        }
    }

    const roles = [
        (projectMember as any)?.role,
        orgRole
    ].filter(Boolean).map(r => r.toLowerCase())

    const adminRoles = ["admin", "project admin", "organization admin", "org admin", "developer"]
    const hasPrivileges = roles.some(role => adminRoles.includes(role))

    if (!hasPrivileges) {
        throw new Error("Requires admin or developer privileges")
    }

    return { supabase, user }
}

export async function getProjectPhases(projectId: string) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data, error } = await supabase
            .from("project_review_phases")
            .select("*")
            .eq("project_id", projectId)
            .order("order_index", { ascending: true })

        if (error) throw error

        return { success: true, phases: data as ProjectReviewPhase[] }
    } catch (error) {
        console.error("Error fetching project phases:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to fetch phases" }
    }
}

export async function saveProjectPhases(projectId: string, phases: Omit<ProjectReviewPhase, "id" | "project_id" | "created_at" | "updated_at">[]) {
    try {
        const { supabase } = await checkAdminPrivileges(projectId)

        // Using a transaction-like approach by deleting then inserting
        // In a more robust system, we would do a merge/upsert or use a stored procedure
        const { error: deleteError } = await supabase
            .from("project_review_phases")
            .delete()
            .eq("project_id", projectId)

        if (deleteError) throw deleteError

        if (phases.length > 0) {
            const { error: insertError } = await supabase
                .from("project_review_phases")
                .insert(
                    phases.map((p, index) => ({
                        project_id: projectId,
                        phase_name: p.phase_name,
                        duration_days: p.duration_days,
                        order_index: index
                    }))
                )

            if (insertError) throw insertError
        }

        revalidatePath(`/projects/${projectId}/settings`)
        return { success: true }
    } catch (error) {
        console.error("Error saving project phases:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to save phases" }
    }
}
