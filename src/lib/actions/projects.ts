"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export type AddProjectMemberState = {
    success?: boolean
    message?: string
}

export async function addProjectMembers(
    projectId: string,
    userIds: string[],
    roleId?: string
): Promise<AddProjectMemberState> {
    const supabase = await createServerSupabaseClient()

    try {
        const insertData = userIds.map(userId => ({
            project_id: projectId,
            user_id: userId,
            role_id: roleId || null,
        }))

        const { error } = await (supabase.from("project_users") as any).insert(insertData)

        if (error) {
            console.error("Failed to add project members:", error)
            return { success: false, message: "Failed to add project members: " + error.message }
        }

        revalidatePath(`/projects/${projectId}`)

        return { success: true, message: "Project members added successfully." }
    } catch (error) {
        console.error("Unexpected error adding project members:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

export async function updateProjectMemberRole(
    projectId: string,
    userId: string,
    roleId: string
): Promise<AddProjectMemberState> {
    const supabase = await createServerSupabaseClient()

    try {
        const { error } = await (supabase.from("project_users") as any)
            .update({ role_id: roleId })
            .eq("project_id", projectId)
            .eq("user_id", userId)

        if (error) {
            console.error("Failed to update project member role:", error)
            return { success: false, message: "Failed to update role: " + error.message }
        }

        revalidatePath(`/projects/${projectId}`)

        return { success: true, message: "Role updated successfully." }
    } catch (error) {
        console.error("Unexpected error updating role:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

export async function removeProjectMember(
    projectId: string,
    userId: string
): Promise<AddProjectMemberState> {
    const supabase = await createServerSupabaseClient()

    try {
        const { error } = await (supabase.from("project_users") as any)
            .delete()
            .eq("project_id", projectId)
            .eq("user_id", userId)

        if (error) {
            console.error("Failed to remove project member:", error)
            return { success: false, message: "Failed to remove member: " + error.message }
        }

        revalidatePath(`/projects/${projectId}`)

        return { success: true, message: "Member removed successfully." }
    } catch (error) {
        console.error("Unexpected error removing member:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

export type InviteByEmailState = {
    success?: boolean
    message?: string
    isNewUser?: boolean
}

export async function inviteProjectMemberByEmail(
    projectId: string,
    email: string,
    roleId?: string,
    firstName?: string,
    lastName?: string
): Promise<InviteByEmailState> {
    const supabase = await createServerSupabaseClient()

    try {
        const normalizedEmail = email.trim().toLowerCase()

        // 1. Look up existing user
        const { data: existingUser, error: lookupError } = await (supabase.from("users") as any)
            .select("id")
            .ilike("email", normalizedEmail)
            .maybeSingle()

        if (lookupError) {
            console.error("Error looking up user by email:", lookupError)
            return { success: false, message: "Failed to look up user: " + lookupError.message }
        }

        let userId: string

        if (existingUser) {
            userId = existingUser.id

            // Check they're not already on the project
            const { data: existingMember } = await (supabase.from("project_users") as any)
                .select("user_id")
                .eq("project_id", projectId)
                .eq("user_id", userId)
                .maybeSingle()

            if (existingMember) {
                return { success: false, message: "This person is already a member of the project." }
            }
        } else {
            // 2. Create stub user
            const { data: newUser, error: insertError } = await (supabase.from("users") as any)
                .insert({
                    email: normalizedEmail,
                    first_name: firstName?.trim() || "",
                    last_name: lastName?.trim() || "",
                })
                .select("id")
                .single()

            if (insertError) {
                console.error("Error creating stub user:", insertError)
                return { success: false, message: "Failed to create user: " + insertError.message }
            }

            userId = newUser.id
        }

        // 3. Add to project
        const { error: memberError } = await (supabase.from("project_users") as any)
            .insert({ project_id: projectId, user_id: userId, role_id: roleId || null })

        if (memberError) {
            console.error("Failed to add member to project:", memberError)
            return { success: false, message: "Failed to add member: " + memberError.message }
        }

        revalidatePath(`/projects/${projectId}`)

        const isNewUser = !existingUser
        const msg = isNewUser
            ? `Invited ${normalizedEmail} — a new account placeholder has been created.`
            : `${normalizedEmail} has been added to the project.`

        return { success: true, message: msg, isNewUser }
    } catch (error: any) {
        console.error("Unexpected error in inviteProjectMemberByEmail:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}
