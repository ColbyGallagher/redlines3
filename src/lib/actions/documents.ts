"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { getProjectSettings } from "@/lib/data/projects"
import { extractMetadataFromPDF } from "@/lib/utils/pdf-extraction"
import type { Document } from "@/lib/db/types"

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
        parentId?: string
        pageNumber?: number
        metadata?: any
        extractionSettings?: any
        skipRevalidate?: boolean
    }
) {
    const supabase = await createServerSupabaseClient()

    let finalDocumentCode = data.documentCode || ""
    let finalDocumentName = data.documentName
    let finalRevision = data.revision || "0"
    let manualReview = false

    try {
        // 1. Check for extraction settings
        // OPTIMIZATION: Only fetch project settings if we actually need them
        let extractionSettings = data.extractionSettings
        if (!extractionSettings && !data.documentCode && !data.revision) {
            const projectSettings = await getProjectSettings(data.projectId)
            extractionSettings = projectSettings?.extraction_settings
        }

        // ONLY perform extraction if we don't have code/revision and settings exist
        if (extractionSettings && data.pdfUrl && !data.documentCode && !data.revision) {
            try {
                const extracted = await extractMetadataFromPDF(data.pdfUrl, extractionSettings)
                if (extracted.documentCode) finalDocumentCode = extracted.documentCode
                if (extracted.documentName) finalDocumentName = extracted.documentName || finalDocumentName
                if (extracted.revision) finalRevision = extracted.revision
                manualReview = extracted.isManualReview
            } catch (extError) {
                console.warn("Server-side extraction failed, falling back to provided data", extError)
                manualReview = true
            }
        }

        const { data: newDoc, error } = await (supabase.from("documents") as any).insert({
            review_id: data.reviewId,
            project_id: data.projectId,
            document_name: finalDocumentName,
            file_size: data.fileSize,
            pdf_url: data.pdfUrl,
            document_code: finalDocumentCode,
            state: manualReview ? "Manual Review" : (data.state || "Uploaded"),
            milestone: data.milestone || "",
            suitability: data.suitability || "",
            version: data.version || "1.0",
            revision: finalRevision,
            parent_id: data.parentId,
            page_number: data.pageNumber,
            uploaded_at: data.state === "Uploaded" || !data.state ? new Date().toISOString() : undefined,
        }).select("id").single()

        if (error) {
            console.error("Database error:", error)
            return { message: "Database error: " + error.message }
        }

        if (!data.skipRevalidate) {
            revalidatePath('/reviews', 'layout')
        }
        return { message: "Success", id: newDoc?.id }
    } catch (error) {
        console.error("Unexpected error in createDocument action:", error)
        return { message: "Failed to create document: " + (error instanceof Error ? error.message : "Unknown error") }
    }
}

export async function deleteDocument(documentId: string, reviewId: string, deleteIssues = false) {
    const supabase = await createServerSupabaseClient()

    try {
        // 1. Get document details for storage path and child discovery
        const { data: document, error: fetchError } = await supabase
            .from("documents")
            .select("id, pdf_url")
            .eq("id", documentId)
            .single() as { data: { id: string, pdf_url: string } | null, error: any }

        if (fetchError || !document) {
            console.error("Fetch error:", fetchError)
            return { message: "Document not found" }
        }

        // 2. Find and handle child documents (e.g., individual pages from a set)
        const { data: children, error: childrenError } = await supabase
            .from("documents")
            .select("id, pdf_url")
            .eq("parent_id", documentId) as { data: { id: string, pdf_url: string }[] | null, error: any }

        if (childrenError) {
            console.error("Error fetching child documents:", childrenError)
        }

        const allDocumentIds = [documentId, ...(children?.map(c => c.id) || [])]
        const allPdfUrls = [document.pdf_url, ...(children?.map(c => c.pdf_url) || [])].filter(Boolean)

        // 3. Conditionally delete or nullify annotations and issues for all related documents
        for (const docId of allDocumentIds) {
            if (deleteIssues) {
                // Delete annotations
                const { error: annError } = await supabase
                    .from("annotations")
                    .delete()
                    .eq("document_id", docId)

                if (annError) {
                    console.error(`Annotation deletion error for ${docId}:`, annError)
                }

                // Delete issues
                const { error: issueError } = await supabase
                    .from("issues")
                    .delete()
                    .eq("document_id", docId)

                if (issueError) {
                    console.error(`Issue deletion error for ${docId}:`, issueError)
                }
            } else {
                // Nullify relationships
                const { error: annNullError } = await (supabase
                    .from("annotations" as any) as any)
                    .update({ document_id: null })
                    .eq("document_id", docId)

                if (annNullError) {
                    console.error(`Annotation nullification error for ${docId}:`, annNullError)
                }

                const { error: issueNullError } = await (supabase
                    .from("issues" as any) as any)
                    .update({ document_id: null })
                    .eq("document_id", docId)

                if (issueNullError) {
                    console.error(`Issue nullification error for ${docId}:`, issueNullError)
                }
            }
        }

        // 4. Delete from Storage for parent and all children
        for (const pdfUrl of allPdfUrls) {
            try {
                const parts = pdfUrl.split("/storage/v1/object/public/documents/")
                if (parts.length === 2) {
                    const storagePath = parts[1]
                    await supabase.storage.from("documents").remove([storagePath])
                }
            } catch (storageError) {
                console.error("Storage deletion error:", storageError)
            }
        }

        // 5. Delete from Database (Children first due to FK constraint)
        if (children && children.length > 0) {
            const { error: childrenDeleteError } = await supabase
                .from("documents")
                .delete()
                .in("id", children.map(c => c.id))
            
            if (childrenDeleteError) {
                console.error("Error deleting child documents:", childrenDeleteError)
                return { message: "Failed to delete child documents: " + childrenDeleteError.message }
            }
        }

        const { error: deleteError } = await supabase
            .from("documents")
            .delete()
            .eq("id", documentId)

        if (deleteError) {
            console.error("Database deletion error:", deleteError)
            return { message: "Failed to delete document record: " + deleteError.message }
        }

        revalidatePath('/reviews', 'layout')
        return { message: "Success" }
    } catch (error) {
        console.error("Unexpected error during deletion:", error)
        return { message: "Failed to delete document" }
    }
}

export type DocumentBatchInput = {
    documentName: string
    fileSize: string
    pdfUrl: string
    documentCode?: string
    state?: string
    milestone?: string
    suitability?: string
    version?: string
    revision?: string
    parentId?: string
    pageNumber?: number
    extractionSettings?: any
    metadata?: any
    children?: DocumentBatchInput[]
}

export async function createDocumentsBatch(
    data: {
        reviewId: string
        projectId: string
        documents: DocumentBatchInput[]
    }
) {
    const supabase = await createServerSupabaseClient()
    
    try {
        const projectSettings = await getProjectSettings(data.projectId)
        const defaultExtractionSettings = projectSettings?.extraction_settings

        const allResults: any[] = []
        
        // We process top-level items sequentially to handle potential parent-child dependencies
        for (const doc of data.documents) {
            // 1. Prepare parent data
            const extractionSettings = doc.extractionSettings || defaultExtractionSettings
            let finalDocumentCode = doc.documentCode || ""
            let finalDocumentName = doc.documentName
            let finalRevision = doc.revision || "0"
            let manualReview = false

            if (extractionSettings && doc.pdfUrl && !doc.documentCode && !doc.revision) {
                try {
                    const extracted = await extractMetadataFromPDF(doc.pdfUrl, extractionSettings)
                    if (extracted.documentCode) finalDocumentCode = extracted.documentCode
                    if (extracted.documentName) finalDocumentName = extracted.documentName || finalDocumentName
                    if (extracted.revision) finalRevision = extracted.revision
                    manualReview = extracted.isManualReview
                } catch (extError) {
                    manualReview = true
                }
            }

            // 2. Insert Parent
            const { data: parentDoc, error: parentError } = await (supabase.from("documents") as any).insert({
                review_id: data.reviewId,
                project_id: data.projectId,
                document_name: finalDocumentName,
                file_size: doc.fileSize,
                pdf_url: doc.pdfUrl,
                document_code: finalDocumentCode,
                state: manualReview ? "Manual Review" : (doc.state || "Uploaded"),
                milestone: doc.milestone || "",
                suitability: doc.suitability || "",
                version: doc.version || "1.0",
                revision: finalRevision,
                parent_id: doc.parentId,
                page_number: doc.pageNumber,
                uploaded_at: (doc.state === "Uploaded" || !doc.state) ? new Date().toISOString() : undefined,
            }).select("id, document_name").single()

            if (parentError) {
                console.error("[Batch Upload] Parent insertion error:", parentError)
                throw parentError
            }
            allResults.push(parentDoc)

            // 3. Insert Children if any
            if (doc.children && doc.children.length > 0) {
                const childrenToInsert = doc.children.map(child => ({
                    review_id: data.reviewId,
                    project_id: data.projectId,
                    document_name: child.documentName,
                    file_size: child.fileSize,
                    pdf_url: child.pdfUrl,
                    document_code: child.documentCode || "",
                    state: child.state || "Uploaded",
                    milestone: child.milestone || "",
                    suitability: child.suitability || "",
                    version: child.version || "1.0",
                    revision: child.revision || "0",
                    parent_id: parentDoc.id,
                    page_number: child.pageNumber,
                    uploaded_at: new Date().toISOString()
                }))

                const { data: insertedChildren, error: childError } = await (supabase.from("documents") as any).insert(childrenToInsert).select("id, document_name")
                if (childError) throw childError
                if (insertedChildren) allResults.push(...insertedChildren)
            }
        }

        revalidatePath('/reviews', 'layout')
        return { message: "Success", documents: allResults }
    } catch (error: any) {
        console.error("Unexpected error in createDocumentsBatch action:", error)
        const errorMessage = error.message || (typeof error === 'object' ? JSON.stringify(error) : String(error))
        return { message: "Failed to create documents: " + errorMessage }
    }
}

export async function getProjectDocuments(projectId: string) {
    const supabase = await createServerSupabaseClient()

    try {
        const { data, error } = await supabase
            .from("documents")
            .select(`
                *,
                reviews:reviews (
                    id,
                    review_name,
                    slug
                )
            `)
            .eq("project_id", projectId)
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Error fetching project documents:", error)
            throw new Error(error.message)
        }

        return data as (Document & { reviews: { id: string, review_name: string, slug: string } | null })[]
    } catch (error) {
        console.error("Unexpected error in getProjectDocuments:", error)
        throw new Error(error instanceof Error ? error.message : "Failed to fetch project documents")
    }
}
