"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"

export type CreateDocumentState = {
    message?: string
    errors?: {
        [key: string]: string[]
    }
}

export async function createDocument(
    data: {
        reviewId: string
        projectId: string
        documentName: string
        fileSize: string
        pdfUrl: string
        documentCode?: string
        state?: string
        milestone?: string
        suitability?: string
        version?: string
        revision?: string
    }
) {
    const supabase = await createServerSupabaseClient()

    try {
        const { error } = await supabase.from("documents").insert({
            review_id: data.reviewId,
            project_id: data.projectId,
            document_name: data.documentName,
            file_size: data.fileSize,
            pdf_url: data.pdfUrl,
            document_code: data.documentCode || "",
            state: data.state || "Uploaded",
            milestone: data.milestone || "",
            suitability: data.suitability || "",
            version: data.version || "1.0",
            revision: data.revision || "0",
            uploaded_at: data.state === "Uploaded" ? new Date().toISOString() : undefined,
        } as any)

        if (error) {
            console.error("Database error:", error)
            return { message: "Database error: " + error.message }
        }

        revalidatePath(`/reviews/${data.reviewId}`)
        return { message: "Success" }
    } catch (error) {
        return { message: "Failed to create document" }
    }
}

export async function deleteDocument(documentId: string, reviewId: string, deleteIssues = false) {
    const supabase = await createServerSupabaseClient()

    try {
        // 1. Get document details for storage path
        const { data: document, error: fetchError } = await supabase
            .from("documents")
            .select("pdf_url")
            .eq("id", documentId)
            .single() as { data: { pdf_url: string } | null, error: any }

        if (fetchError || !document) {
            console.error("Fetch error:", fetchError)
            return { message: "Document not found" }
        }

        // 2. Conditionally delete or nullify annotations and issues
        if (deleteIssues) {
            // Delete annotations
            const { error: annError } = await supabase
                .from("annotations")
                .delete()
                .eq("document_id", documentId)

            if (annError) {
                console.error("Annotation deletion error:", annError)
            }

            // Delete issues
            const { error: issueError } = await supabase
                .from("issues")
                .delete()
                .eq("document_id", documentId)

            if (issueError) {
                console.error("Issue deletion error:", issueError)
            }
        } else {
            // Nullify relationships instead of deleting
            const { error: annNullError } = await (supabase
                .from("annotations" as any) as any)
                .update({ document_id: null })
                .eq("document_id", documentId)

            if (annNullError) {
                console.error("Annotation nullification error:", annNullError)
            }

            const { error: issueNullError } = await (supabase
                .from("issues" as any) as any)
                .update({ document_id: null })
                .eq("document_id", documentId)

            if (issueNullError) {
                console.error("Issue nullification error:", issueNullError)
            }
        }

        // 3. Delete from Storage
        if (document.pdf_url) {
            try {
                const parts = document.pdf_url.split("/storage/v1/object/public/documents/")
                if (parts.length === 2) {
                    const storagePath = parts[1]
                    await supabase.storage.from("documents").remove([storagePath])
                }
            } catch (storageError) {
                console.error("Storage deletion error:", storageError)
            }
        }

        // 4. Delete from Database
        const { error: deleteError } = await supabase
            .from("documents")
            .delete()
            .eq("id", documentId)

        if (deleteError) {
            console.error("Database deletion error:", deleteError)
            return { message: "Failed to delete document record: " + deleteError.message }
        }

        revalidatePath(`/reviews/${reviewId}`)
        return { message: "Success" }
    } catch (error) {
        console.error("Unexpected error during deletion:", error)
        return { message: "Failed to delete document" }
    }
}
