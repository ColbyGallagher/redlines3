"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function requestAccess(projectId: string) {
    const supabase = await createServerSupabaseClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return { success: false, message: "You must be logged in to request access." }
        }

        const { error } = await (supabase.from("access_requests") as any).insert({
            project_id: projectId,
            user_id: user.id,
            status: "pending"
        })

        if (error) {
            if (error.code === "23505") { // Unique violation
                return { success: true, message: "You have already requested access for this project." }
            }
            console.error("Error requesting access:", error)
            return { success: false, message: "Failed to request access: " + error.message }
        }

        revalidatePath(`/projects/${projectId}`)
        return { success: true, message: "Access request sent successfully." }
    } catch (error) {
        console.error("Unexpected error in requestAccess:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}
