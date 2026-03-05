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
    role: string = "Member"
): Promise<AddProjectMemberState> {
    const supabase = await createServerSupabaseClient()

    try {
        const insertData = userIds.map(userId => ({
            project_id: projectId,
            user_id: userId,
            role: role,
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
