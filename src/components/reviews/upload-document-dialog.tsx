"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { uploadFile } from "@/lib/supabase/storage"

import { createDocument } from "@/lib/actions/documents"

type UploadDocumentDialogProps = {
    reviewId: string
    projectId: string
    bucket?: string
}

type FileEntry = {
    file: File
    name: string
    code: string
}

export function UploadDocumentDialog({ reviewId, projectId, bucket = "documents" }: UploadDocumentDialogProps) {
    const [open, setOpen] = useState(false)
    const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const router = useRouter()

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : []
        const entries = files.map((file) => ({
            file,
            name: file.name,
            code: "",
        }))

        setFileEntries(entries)
    }

    const updateEntry = (index: number, updates: Partial<FileEntry>) => {
        setFileEntries((current) =>
            current.map((entry, idx) => (idx === index ? { ...entry, ...updates } : entry)),
        )
    }

    const handleUpload = async () => {
        if (!fileEntries.length) return

        setIsUploading(true)
        try {
            for (const entry of fileEntries) {
                const timestamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
                const sanitizedName = entry.file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
                const path = `${reviewId}/${timestamp}-${sanitizedName}`

                await uploadFile(bucket, path, entry.file)

                const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(path)
                const publicUrl = publicUrlData.publicUrl

                const result = await createDocument({
                    reviewId,
                    projectId,
                    documentName: entry.name || entry.file.name,
                    documentCode: entry.code,
                    fileSize: entry.file.size.toString(),
                    pdfUrl: publicUrl,
                })

                if (result.message !== "Success") {
                    throw new Error(result.message)
                }
            }

            toast.success("Document uploaded successfully")

            setOpen(false)
            setFileEntries([])
            router.refresh()
        } catch (error) {
            console.error("Upload error:", error)
            toast.error("Failed to upload document. Please try again.")
        } finally {
            setIsUploading(false)
        }
    }

    const handleDialogOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && fileEntries.length && !isUploading) {
            const confirmClose = window.confirm(
                "You have selected documents. Upload them before closing? Click Cancel to stay open and Upload, or OK to close without uploading.",
            )

            if (!confirmClose) {
                return
            }

            setFileEntries([])
        }

        setOpen(nextOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleDialogOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Upload className="size-4" />
                    Upload document
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                        Select one or more files to upload to this review.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="document">Files</Label>
                        <Input id="document" type="file" multiple onChange={handleFileChange} />
                    </div>
                    {fileEntries.length > 0 && (
                        <div className="space-y-4 pt-2">
                            {fileEntries.map((entry, index) => (
                                <div
                                    key={`${entry.file.name}-${entry.file.lastModified}`}
                                    className="rounded-md border border-muted/50 p-3"
                                >
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span className="font-medium text-sm">{entry.file.name}</span>
                                        <span>{(entry.file.size / 1024).toFixed(2)} KB</span>
                                    </div>
                                    <div className="grid gap-1.5 pt-3">
                                        <Label htmlFor={`documentName-${index}`}>Document Name</Label>
                                        <Input
                                            id={`documentName-${index}`}
                                            value={entry.name}
                                            onChange={(event) =>
                                                updateEntry(index, { name: event.target.value })
                                            }
                                            placeholder="Enter document name"
                                        />
                                    </div>
                                    <div className="grid gap-1.5 pt-2">
                                        <Label htmlFor={`documentCode-${index}`}>Document Code</Label>
                                        <Input
                                            id={`documentCode-${index}`}
                                            value={entry.code}
                                            onChange={(event) =>
                                                updateEntry(index, { code: event.target.value })
                                            }
                                            placeholder="Optional document code"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button type="submit" onClick={handleUpload} disabled={!fileEntries.length || isUploading}>
                        {isUploading && <Loader2 className="mr-2 size-4 animate-spin" />}
                        Upload
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
