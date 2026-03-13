"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { createDocument, createDocumentsBatch, type CreateDocumentState } from "@/lib/actions/documents"
import { ExtractionSetup } from "@/lib/db/types"
import { extractMetadataFromPDF, extractAllPagesMetadata } from "@/lib/utils/pdf-extraction"

type UploadDocumentDialogProps = {
    reviewId: string
    projectId: string
    bucket?: string
}

type PageEntry = {
    pageNumber: number
    name: string
    code: string
    revision: string
    isExtracting?: boolean
}

type FileEntry = {
    file: File
    name: string
    code: string
    revision: string
    isMultiPage: boolean
    pages: PageEntry[]
    isExtracting?: boolean
    totalPages?: number
}

export function UploadDocumentDialog({ reviewId, projectId, bucket = "documents" }: UploadDocumentDialogProps) {
    const [open, setOpen] = useState(false)
    const [fileEntries, setFileEntries] = useState<FileEntry[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const [setups, setSetups] = useState<ExtractionSetup[]>([])
    const [selectedSetupId, setSelectedSetupId] = useState<string>("")
    const [isLoadingSetups, setIsLoadingSetups] = useState(false)
    const router = useRouter()

    const extractionSetupPlaceholder = isLoadingSetups
        ? "Loading setups..."
        : setups.length
            ? "Select a setup"
            : "No setups saved"

    const loadSetups = useCallback(async () => {
        setIsLoadingSetups(true)
        try {
            const response = await fetch(`/api/projects/${projectId}/extraction-setups`)
            if (!response.ok) throw new Error("Failed to load extraction setups")
            const data = await response.json()
            const projectSetups: ExtractionSetup[] =
                Array.isArray(data?.extraction_setups)
                    ? data.extraction_setups
                    : Array.isArray(data?.settings?.extraction_setups)
                        ? data.settings.extraction_setups
                        : []

            setSetups(projectSetups)
            if (!projectSetups.length) {
                setSelectedSetupId("")
                return
            }

            setSelectedSetupId((prev) => {
                if (prev && projectSetups.some((setup) => setup.id === prev)) {
                    return prev
                }

                return projectSetups[0].id
            })
        } catch (error) {
            console.error("Error loading extraction setups:", error)
            setSetups([])
            setSelectedSetupId("")
        } finally {
            setIsLoadingSetups(false)
        }
    }, [projectId])

    const formatFileSize = (bytes: number) => {
        const mb = bytes / (1024 * 1024)
        if (mb >= 1) {
            return `${mb.toFixed(2)} MB`
        }
        return `${(bytes / 1024).toFixed(2)} KB`
    }

    useEffect(() => {
        if (open) {
            loadSetups()
        }
    }, [open, loadSetups])

    const runExtraction = useCallback(async (index: number, file: File, setupId: string) => {
        if (!setupId || setupId === "none") return

        const activeSetup = setups.find(s => s.id === setupId)
        if (!activeSetup) return

        setFileEntries(current => current.map((entry, idx) => 
            idx === index ? { ...entry, isExtracting: true } : entry
        ))
        
        try {
            // Create a temporary URL for the file to pass to the extraction utility
            const fileUrl = URL.createObjectURL(file)
            
            // For now we assume extractionSettings is in activeSetup.settings
            const metadata = await extractMetadataFromPDF(fileUrl, activeSetup.settings as any, false)
            
            setFileEntries(current => 
                current.map((entry, idx) => 
                    idx === index ? {
                        ...entry,
                        name: metadata.documentName || entry.name,
                        code: metadata.documentCode || entry.code,
                        revision: metadata.revision || entry.revision
                    } : entry
                )
            )

            // Clean up the temporary URL
            URL.revokeObjectURL(fileUrl)
        } catch (error) {
            console.error(`[PDF Extraction] Error extracting from ${file.name}:`, error)
        } finally {
            setFileEntries(current => current.map((entry, idx) => 
                idx === index ? { ...entry, isExtracting: false } : entry
            ))
        }
    }, [setups])

    const runMultiPageExtraction = useCallback(async (entryIndex: number, file: File, setupId: string) => {
        if (!setupId || setupId === "none") return

        const activeSetup = setups.find(s => s.id === setupId)
        if (!activeSetup) return

        try {
            const fileUrl = URL.createObjectURL(file)
            
            // First, update the parent entry to show it's extracting
            setFileEntries(current => current.map((entry, idx) => 
                idx === entryIndex ? { ...entry, isExtracting: true } : entry
            ))

            // Get all metadata
            const allMetadata = await extractAllPagesMetadata(fileUrl, activeSetup.settings as any, false)
            
            setFileEntries(current => 
                current.map((entry, idx) => 
                    idx === entryIndex ? {
                        ...entry,
                        isExtracting: false,
                        totalPages: allMetadata.length,
                        pages: allMetadata.map((m, i) => ({
                            pageNumber: i + 1,
                            name: m.documentName || `Page ${i + 1}`,
                            code: m.documentCode || "",
                            revision: m.revision || "",
                            isExtracting: false
                        }))
                    } : entry
                )
            )

            URL.revokeObjectURL(fileUrl)
        } catch (error) {
            console.error(`[PDF Extraction] Error in multi-page extraction:`, error)
            setFileEntries(current => current.map((entry, idx) => 
                idx === entryIndex ? { ...entry, isExtracting: false } : entry
            ))
        }
    }, [setups])

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files ? Array.from(e.target.files) : []
        const entries = files.map((file) => ({
            file,
            name: file.name,
            code: "",
            revision: "",
            isMultiPage: false,
            pages: []
        }))

        setFileEntries(entries)

        if (selectedSetupId && selectedSetupId !== "none") {
            entries.forEach((entry, index) => {
                runExtraction(index, entry.file, selectedSetupId)
            })
        }
    }

    // Effect to re-run extraction when selectedSetupId changes
    useEffect(() => {
        if (selectedSetupId && selectedSetupId !== "none" && fileEntries.length > 0) {
            fileEntries.forEach((entry, index) => {
                if (entry.isMultiPage) {
                    runMultiPageExtraction(index, entry.file, selectedSetupId)
                } else {
                    runExtraction(index, entry.file, selectedSetupId)
                }
            })
        }
    }, [selectedSetupId, runExtraction, runMultiPageExtraction, fileEntries.length])

    const updateEntry = (index: number, updates: Partial<FileEntry>) => {
        setFileEntries((current) =>
            current.map((entry, idx) => (idx === index ? { ...entry, ...updates } : entry)),
        )
    }

    const handleUpload = async () => {
        if (!fileEntries.length) return

        const batchDocuments: any[] = []
        setIsUploading(true)
        try {
            for (const entry of fileEntries) {
                // 1. Storage Upload (one per literal file)
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

                // 2. Prepare Metadata for Batch
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

            // 3. Send all metadata in ONE request
            const result = await createDocumentsBatch({
                reviewId,
                projectId,
                documents: batchDocuments
            })

            if (result.message === "Success") {
                toast.success("All documents uploaded successfully")
                setFileEntries([])
                setOpen(false)
                router.refresh()
            } else {
                toast.error(result.message || "Failed to finalize upload")
            }
        } catch (error) {
            console.error("Upload error:", error)
            toast.error(error instanceof Error ? error.message : "Upload failed")
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
            <DialogContent className="sm:max-w-[1000px] w-full max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Upload Document</DialogTitle>
                    <DialogDescription>
                        Select one or more files to upload to this review.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="extraction-setup">Extraction Setup</Label>
                            <Select value={selectedSetupId} onValueChange={setSelectedSetupId}>
                                <SelectTrigger id="extraction-setup">
                                    <SelectValue placeholder={extractionSetupPlaceholder} />
                                </SelectTrigger>
                                <SelectContent>
                                    {setups.length > 0 ? (
                                        setups.map((setup) => (
                                            <SelectItem key={setup.id} value={setup.id}>
                                                {setup.name}
                                            </SelectItem>
                                        ))
                                    ) : (
                                        <SelectItem value="none" disabled>
                                            {isLoadingSetups ? "Loading setups..." : "Create a setup first"}
                                        </SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="document">Files</Label>
                            <Input id="document" type="file" multiple onChange={handleFileChange} />
                        </div>
                        <p className="text-xs text-muted-foreground sm:col-span-2">
                            Choose how metadata extraction should read code, title, and revision from your PDFs.
                        </p>
                    </div>
                    {fileEntries.length > 0 && (
                        <div className="rounded-md border border-muted/50">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[25%]">Title</TableHead>
                                        <TableHead className="w-[15%]">Document Code</TableHead>
                                        <TableHead className="w-[10%]">Revision</TableHead>
                                        <TableHead className="w-[15%]">Filename</TableHead>
                                        <TableHead className="w-[10%] text-center">Multi-page</TableHead>
                                        <TableHead className="w-[10%] text-right">Size</TableHead>
                                        <TableHead className="w-[15%] text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {fileEntries.map((entry, index) => (
                                        <Fragment key={`${entry.file.name}-${entry.file.lastModified}`}>
                                            <TableRow className={entry.isMultiPage ? "bg-muted/30" : ""}>
                                                <TableCell>
                                                    <div className="relative">
                                                        <Input
                                                            id={`documentName-${index}`}
                                                            value={entry.name}
                                                            onChange={(event) =>
                                                                updateEntry(index, { name: event.target.value })
                                                            }
                                                            placeholder="Enter document title"
                                                            className="h-9"
                                                            aria-label={`Document title for ${entry.file.name}`}
                                                            disabled={entry.isMultiPage}
                                                        />
                                                        {entry.isExtracting && (
                                                            <div className="absolute inset-y-0 right-2 flex items-center">
                                                                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        id={`documentCode-${index}`}
                                                        value={entry.code}
                                                        onChange={(event) =>
                                                            updateEntry(index, { code: event.target.value })
                                                        }
                                                        placeholder="Document code"
                                                        className="h-9"
                                                        aria-label={`Document code for ${entry.file.name}`}
                                                        disabled={entry.isMultiPage}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        id={`documentRevision-${index}`}
                                                        value={entry.revision}
                                                        onChange={(event) =>
                                                            updateEntry(index, { revision: event.target.value })
                                                        }
                                                        placeholder="Rev"
                                                        className="h-9"
                                                        aria-label={`Document revision for ${entry.file.name}`}
                                                        disabled={entry.isMultiPage}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground truncate max-w-[150px]">
                                                    {entry.file.name}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={entry.isMultiPage}
                                                        onChange={(e) => {
                                                            const checked = e.target.checked
                                                            updateEntry(index, { isMultiPage: checked })
                                                            if (checked && selectedSetupId) {
                                                                runMultiPageExtraction(index, entry.file, selectedSetupId)
                                                            }
                                                        }}
                                                        className="size-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                                    {formatFileSize(entry.file.size)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => setFileEntries(curr => curr.filter((_, i) => i !== index))}
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        Remove
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                            
                                            {/* Page Sub-rows */}
                                            {entry.isMultiPage && (
                                                <>
                                                    {entry.isExtracting && !entry.pages.length && (
                                                        <TableRow>
                                                            <TableCell colSpan={7} className="py-2 text-center text-xs text-muted-foreground italic">
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <Loader2 className="size-3 animate-spin" />
                                                                    Scanning PDF pages...
                                                                </div>
                                                            </TableCell>
                                                        </TableRow>
                                                    )}
                                                    {entry.pages.map((page, pageIdx) => (
                                                        <TableRow key={`page-${index}-${pageIdx}`} className="bg-muted/10 border-l-4 border-l-primary/30">
                                                            <TableCell className="pl-8">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] uppercase font-bold text-muted-foreground whitespace-nowrap">Pg {page.pageNumber}</span>
                                                                    <Input
                                                                        value={page.name}
                                                                        onChange={(e) => {
                                                                            const newPages = [...entry.pages]
                                                                            newPages[pageIdx].name = e.target.value
                                                                            updateEntry(index, { pages: newPages })
                                                                        }}
                                                                        className="h-8 text-sm"
                                                                    />
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={page.code}
                                                                    onChange={(e) => {
                                                                        const newPages = [...entry.pages]
                                                                        newPages[pageIdx].code = e.target.value
                                                                        updateEntry(index, { pages: newPages })
                                                                    }}
                                                                    placeholder="Code"
                                                                    className="h-8 text-sm"
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Input
                                                                    value={page.revision}
                                                                    onChange={(e) => {
                                                                        const newPages = [...entry.pages]
                                                                        newPages[pageIdx].revision = e.target.value
                                                                        updateEntry(index, { pages: newPages })
                                                                    }}
                                                                    placeholder="Rev"
                                                                    className="h-8 text-sm"
                                                                />
                                                            </TableCell>
                                                            <TableCell colSpan={4}></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </>
                                            )}
                                        </Fragment>
                                    ))}
                                </TableBody>
                            </Table>
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
