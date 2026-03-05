"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export type UpdateProfileState = {
    success?: boolean
    message?: string
}

export async function updateProfile(data: {
    firstName: string
    lastName: string
    jobTitle: string
}): Promise<UpdateProfileState> {
    const supabase = await createServerSupabaseClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        return { success: false, message: "You must be signed in to update your profile." }
    }

    const firstName = data.firstName.trim()
    const lastName = data.lastName.trim()
    const jobTitle = data.jobTitle.trim()

    if (!firstName || !lastName) {
        return { success: false, message: "First name and last name are required." }
    }

    // Upsert the user profile into the users table (keyed by auth user id)
    const { error: upsertError } = await (supabase.from("users") as any).upsert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email: user.email,
        job_title: jobTitle || null,
    })

    if (upsertError) {
        console.error("Failed to upsert user profile:", upsertError)
        return { success: false, message: "Failed to save profile: " + upsertError.message }
    }

    revalidatePath("/account")

    return { success: true, message: "Profile saved successfully." }
}
