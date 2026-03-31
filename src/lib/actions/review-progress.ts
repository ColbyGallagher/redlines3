"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export async function logDocumentView(reviewId: string, documentId: string) {
    const supabase = await createServerSupabaseClient()

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, message: "Authentication required" }
        }

        // 1. Log the document view (unique per user/document)
        const { error: viewError } = await (supabase.from("review_document_views") as any)
            .upsert({
                review_id: reviewId,
                document_id: documentId,
                user_id: user.id,
                viewed_at: new Date().toISOString()
            }, {
                onConflict: "user_id, document_id"
            })

        if (viewError) {
            console.error("Failed to log document view:", viewError)
            return { success: false, message: viewError.message }
        }

        // 2. Set started_at if not already set for this reviewer
        const { data: reviewer, error: reviewerError } = await (supabase.from("review_users") as any)
            .select("started_at")
            .eq("review_id", reviewId)
            .eq("user_id", user.id)
            .single()

        if (!reviewerError && reviewer && !reviewer.started_at) {
            await (supabase.from("review_users") as any)
                .update({ started_at: new Date().toISOString() })
                .eq("review_id", reviewId)
                .eq("user_id", user.id)
        }

        revalidatePath('/reviews', 'layout')
        return { success: true }
    } catch (error) {
        console.error("Unexpected error logging document view:", error)
        return { success: false, message: "An unexpected error occurred" }
    }
}

export async function markReviewAsComplete(reviewId: string) {
    const supabase = await createServerSupabaseClient()

    try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, message: "Authentication required" }
        }

        const { error } = await (supabase.from("review_users") as any)
            .update({ completed_at: new Date().toISOString() })
            .eq("review_id", reviewId)
            .eq("user_id", user.id)

        if (error) {
            console.error("Failed to mark review as complete:", error)
            return { success: false, message: error.message }
        }

        revalidatePath('/reviews', 'layout')
        return { success: true, message: "Your review has been marked as complete." }
    } catch (error) {
        console.error("Unexpected error marking review as complete:", error)
        return { success: false, message: "An unexpected error occurred" }
    }
}
