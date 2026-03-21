"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export type LookupTable =
    | "project_milestones"
    | "project_disciplines"
    | "project_importances"
    | "project_states"
    | "project_statuses"
    | "project_packages"
    | "project_classifications"

async function checkAdminPrivileges(projectId: string) {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error("Unauthorized")
    }

    // 1. Get the project to find its company_id
    const { data: project } = await supabase
        .from("projects")
        .select("company_id")
        .eq("id", projectId)
        .single() as any

    // 2. Check project-specific role
    const { data: projectMember } = await supabase
        .from("project_users")
        .select("role")
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .maybeSingle() as any

    // 3. Check organization-wide role
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

export async function addLookupItem(projectId: string, table: LookupTable, name: string, description?: string) {
    try {
        const { supabase } = await checkAdminPrivileges(projectId)

        const insertData: any = {
            project_id: projectId,
            name,
        }

        if (table === "project_milestones") {
            insertData.description = description
            insertData.is_selected = true
        }

        const { error } = await (supabase as any).from(table).insert(insertData)

        if (error) throw error

        revalidatePath(`/projects/${projectId}/settings`)
        return { success: true }
    } catch (error) {
        console.error(`Error adding item to ${table}:`, error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to add item" }
    }
}

export async function updateLookupItem(projectId: string, table: LookupTable, id: string, name: string, description?: string) {
    try {
        const { supabase } = await checkAdminPrivileges(projectId)

        const updateData: any = {
            name,
        }

        if (table === "project_milestones") {
            updateData.description = description
        }

        const { error } = await (supabase as any).from(table).update(updateData).eq("id", id).eq("project_id", projectId)

        if (error) throw error

        revalidatePath(`/projects/${projectId}/settings`)
        return { success: true }
    } catch (error) {
        console.error(`Error updating item in ${table}:`, error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to update item" }
    }
}

export async function deleteLookupItem(projectId: string, table: LookupTable, id: string) {
    try {
        const { supabase } = await checkAdminPrivileges(projectId)

        const { error } = await (supabase as any).from(table).delete().eq("id", id).eq("project_id", projectId)

        if (error) {
            // Handle foreign key constraint errors gracefully
            if (error.code === "23503") {
                return { success: false, error: "This item is currently in use and cannot be deleted." }
            }
            throw error
        }

        revalidatePath(`/projects/${projectId}/settings`)
        return { success: true }
    } catch (error) {
        console.error(`Error deleting item from ${table}:`, error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to delete item" }
    }
}

export async function updateStateOrder(projectId: string, orderedStateIds: string[]) {
    try {
        const { supabase } = await checkAdminPrivileges(projectId)

        // Update each state's order_index
        // Using a loop here as Supabase doesn't have a bulk update for multiple different values easily without a stored procedure
        for (let i = 0; i < orderedStateIds.length; i++) {
            const { error } = await (supabase as any)
                .from("project_states")
                .update({ order_index: i })
                .eq("id", orderedStateIds[i])
                .eq("project_id", projectId)
            
            if (error) throw error
        }

        revalidatePath(`/projects/${projectId}/settings`)
        return { success: true }
    } catch (error) {
        console.error("Error updating state order:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to update state order" }
    }
}

export async function updateStatePermissions(projectId: string, stateId: string, allowedRoles: string[]) {
    try {
        const { supabase } = await checkAdminPrivileges(projectId)

        const { error } = await (supabase as any)
            .from("project_states")
            .update({ allowed_roles: allowedRoles })
            .eq("id", stateId)
            .eq("project_id", projectId)

        if (error) throw error

        revalidatePath(`/projects/${projectId}/settings`)
        return { success: true }
    } catch (error) {
        console.error("Error updating state permissions:", error)
        return { success: false, error: error instanceof Error ? error.message : "Failed to update state permissions" }
    }
}
