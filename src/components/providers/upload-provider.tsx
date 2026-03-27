"use client"

import { createContext, useContext, ReactNode } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"
import { createDocumentsBatch } from "@/lib/actions/documents"
import { createReferenceDocument } from "@/lib/actions/reference-documents"

export type PageEntry = {
    pageNumber: number
    name: string
    code: string
    revision: string
    isExtracting?: boolean
}

export type FileEntry = {
    file: File
    name: string
    code: string
    revision: string
    isMultiPage: boolean
    pages: PageEntry[]
    isExtracting?: boolean
    totalPages?: number
}

type UploadContextType = {
    startReviewUpload: (fileEntries: FileEntry[], projectId: string, reviewId: string, bucket?: string) => void
    startReferenceUpload: (file: File, projectId: string) => void
}

const UploadContext = createContext<UploadContextType | undefined>(undefined)

export function UploadProvider({ children }: { children: ReactNode }) {
    const router = useRouter()

    const startReviewUpload = (fileEntries: FileEntry[], projectId: string, reviewId: string, bucket: string = "documents") => {
        if (!fileEntries.length) return

        const uploadPromise = async () => {
            const batchDocuments: any[] = []
            
            for (const entry of fileEntries) {
                const sanitizedName = entry.file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
                const filePath = `${projectId}/${reviewId}/${Date.now()}-${sanitizedName}`
                
                const { error: uploadError } = await supabase.storage
                    .from(bucket)
                    .upload(filePath, entry.file)

                if (uploadError) {
                    throw new Error(`Upload error for ${entry.file.name}: ${uploadError.message}`)
                }

                const { data: publicUrlData } = supabase.storage
                    .from(bucket)
                    .getPublicUrl(filePath)
                
                const publicUrl = publicUrlData.publicUrl

                if (entry.isMultiPage && entry.pages.length > 0) {
                    batchDocuments.push({
                        documentName: entry.name || entry.file.name,
                        documentCode: entry.code,
                        revision: entry.revision,
                        fileSize: entry.file.size.toString(),
                        pdfUrl: publicUrl,
                        state: "Combined set",
                        children: entry.pages.map(page => ({
                            documentName: page.name,
                            documentCode: page.code,
                            revision: page.revision,
                            fileSize: entry.file.size.toString(),
                            pdfUrl: publicUrl,
                            pageNumber: page.pageNumber,
                            metadata: {
                                isMultiPage: true,
                                originalFilename: entry.file.name
                            }
                        }))
                    })
                } else {
                    batchDocuments.push({
                        documentName: entry.name || entry.file.name,
                        documentCode: entry.code,
                        revision: entry.revision,
                        fileSize: entry.file.size.toString(),
                        pdfUrl: publicUrl,
                    })
                }
            }

            const result = await createDocumentsBatch({
                reviewId,
                projectId,
                documents: batchDocuments
            })

            if (result.message !== "Success") {
                throw new Error(result.message || "Failed to finalize upload")
            }
            
            router.refresh()
            return result
        }

        toast.promise(uploadPromise(), {
            loading: `Uploading ${fileEntries.length} document(s)...`,
            success: "All documents uploaded successfully",
            error: (err) => err instanceof Error ? err.message : "Upload failed"
        })
    }

    const startReferenceUpload = (file: File, projectId: string) => {
        const uploadPromise = async () => {
            const fileId = crypto.randomUUID()
            const storagePath = `${projectId}/${fileId}-${file.name}`
            
            const { error: storageError } = await supabase.storage
              .from("project-references")
              .upload(storagePath, file, {
                contentType: file.type,
                upsert: false
              })

            if (storageError) {
              throw new Error(`Upload failed: ${storageError.message}`)
            }

            const result = await createReferenceDocument(projectId, {
              fileName: file.name,
              fileSize: file.size,
              contentType: file.type,
              storagePath: storagePath
            })

            if (!result.success) {
              await supabase.storage.from("project-references").remove([storagePath])
              throw new Error(result.message || "Database recording failed")
            }
            
            router.refresh()
            return result
        }

        toast.promise(uploadPromise(), {
            loading: `Uploading ${file.name}...`,
            success: "Reference document uploaded successfully",
            error: (err) => err instanceof Error ? err.message : "Upload failed"
        })
    }

    return (
        <UploadContext.Provider value={{ startReviewUpload, startReferenceUpload }}>
            {children}
        </UploadContext.Provider>
    )
}

export function useBackgroundUpload() {
    const context = useContext(UploadContext)
    if (context === undefined) {
        throw new Error("useBackgroundUpload must be used within an UploadProvider")
    }
    return context
}
