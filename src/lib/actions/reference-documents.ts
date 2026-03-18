"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { ProjectReferenceDocument } from "@/lib/db/types"

export type ActionState = {
  success?: boolean
  message?: string
}

/**
 * Records a reference document's metadata in the database.
 * The file itself must be uploaded via client-side SDK first.
 */
export async function createReferenceDocument(
    projectId: string,
    metadata: {
        fileName: string
        fileSize: number
        contentType: string
        storagePath: string
    }
): Promise<ActionState> {
    const supabase = await createServerSupabaseClient()

    try {
        // 1. Verify Authentication & Permissions
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user) {
            return { success: false, message: "Authentication required." }
        }

        // Check if user is an admin, owner, or developer of the project
        const { data: memberData } = await (supabase.from("project_users") as any)
            .select("role")
            .eq("project_id", projectId)
            .eq("user_id", userData.user.id)
            .maybeSingle()

        const projectRole = (memberData as any)?.role?.toLowerCase()
        let isAuthorized = projectRole === "admin" || projectRole === "owner" || projectRole === "developer"

        // If not authorized by project role, check global roles (org admin, admin, developer)
        if (!isAuthorized) {
            const { data: orgRoles } = await (supabase.from("user_companies") as any)
                .select(`roles:role_id (name)`)
                .eq("user_id", userData.user.id)
                .eq("active", true)

            const globalRoles = (orgRoles || []).map((uc: any) => uc.roles?.name?.toLowerCase()).filter(Boolean)
            isAuthorized = globalRoles.includes('org admin') || globalRoles.includes('admin') || globalRoles.includes('developer')
        }

        if (!isAuthorized) {
            return { success: false, message: "Unauthorized. Insufficient permissions." }
        }

        // 2. Insert into Database
        const { error: dbError } = await (supabase.from("project_reference_documents") as any).insert({
            project_id: projectId,
            file_name: metadata.fileName,
            file_size: metadata.fileSize,
            content_type: metadata.contentType,
            storage_path: metadata.storagePath,
            uploaded_by: userData.user.id
        })

        if (dbError) {
            console.error("Database insert failed:", dbError)
            return { success: false, message: `Database recording failed: ${dbError.message}` }
        }

        revalidatePath(`/projects/${projectId}`)
        return { success: true, message: "Document recorded successfully." }

    } catch (error) {
        console.error("Unexpected error in createReferenceDocument:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

/**
 * Deletes a reference document from storage and the database.
 */
export async function deleteReferenceDocument(
    documentId: string,
    storagePath: string,
    projectId: string
): Promise<ActionState> {
    const supabase = await createServerSupabaseClient()

    try {
        // 1. Verify Authentication & Permissions
        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData.user) {
            return { success: false, message: "Authentication required." }
        }

        // Check if user is an admin, owner, or developer of the project
        const { data: memberData } = await (supabase.from("project_users") as any)
            .select("role")
            .eq("project_id", projectId)
            .eq("user_id", userData.user.id)
            .maybeSingle()

        const projectRole = (memberData as any)?.role?.toLowerCase()
        let isAuthorized = projectRole === "admin" || projectRole === "owner" || projectRole === "developer"

        // If not authorized by project role, check global roles (org admin, admin, developer)
        if (!isAuthorized) {
            const { data: orgRoles } = await (supabase.from("user_companies") as any)
                .select(`roles:role_id (name)`)
                .eq("user_id", userData.user.id)
                .eq("active", true)

            const globalRoles = (orgRoles || []).map((uc: any) => uc.roles?.name?.toLowerCase()).filter(Boolean)
            isAuthorized = globalRoles.includes('org admin') || globalRoles.includes('admin') || globalRoles.includes('developer')
        }

        if (!isAuthorized) {
            return { success: false, message: "Unauthorized. Insufficient permissions." }
        }

        // 2. Delete from Storage
        const { error: storageError } = await supabase.storage
            .from("project-references")
            .remove([storagePath])

        if (storageError) {
            console.error("Storage deletion failed:", storageError)
            // Continue even if storage fails, maybe it's already gone
        }

        // 3. Delete from Database
        const { error: dbError } = await (supabase.from("project_reference_documents") as any)
            .delete()
            .eq("id", documentId)

        if (dbError) {
            console.error("Database deletion failed:", dbError)
            return { success: false, message: `Database deletion failed: ${dbError.message}` }
        }

        revalidatePath(`/projects/${projectId}`)
        return { success: true, message: "Document deleted successfully." }

    } catch (error) {
        console.error("Unexpected error in deleteReferenceDocument:", error)
        return { success: false, message: "An unexpected error occurred." }
    }
}

/**
 * Fetches all reference documents for a given project.
 */
export async function getReferenceDocuments(projectId: string): Promise<any[]> {
    const supabase = await createServerSupabaseClient()

    try {
        const { data, error } = await (supabase.from("project_reference_documents") as any)
            .select(`
                *,
                user:uploaded_by (
                    first_name,
                    last_name
                )
            `)
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Failed to fetch reference documents:", error)
            return []
        }

        return data || []
    } catch (error) {
        console.error("Unexpected error in getReferenceDocuments:", error)
        return []
    }
}

/**
 * Generates a signed URL for downloading a reference document.
 */
export async function getReferenceDocumentSignedUrl(storagePath: string): Promise<string | null> {
    const supabase = await createServerSupabaseClient()

    try {
        const { data, error } = await supabase.storage
            .from("project-references")
            .createSignedUrl(storagePath, 3600) // 1 hour expiry

        if (error) {
            console.error("Failed to generate signed URL:", error)
            return null
        }

        return data.signedUrl
    } catch (error) {
        console.error("Unexpected error in getReferenceDocumentSignedUrl:", error)
        return null
    }
}
