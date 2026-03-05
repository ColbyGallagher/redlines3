"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { ReviewUser } from "@/lib/data/reviews"
import { toTitleCaseFallback } from "@/lib/utils/user-utils"

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
