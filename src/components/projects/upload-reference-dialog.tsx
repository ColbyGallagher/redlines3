"use client"

import { useState, useTransition } from "react"
import { createReferenceDocument } from "@/lib/actions/reference-documents"
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
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase/client"

interface UploadReferenceDialogProps {
  projectId: string
}

export function UploadReferenceDialog({ projectId }: UploadReferenceDialogProps) {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file to upload.")
      return
    }

    startTransition(async () => {
      try {
        // 1. Upload to Storage via client SDK (bypasses Server Action limits)
        const fileId = crypto.randomUUID()
        const storagePath = `${projectId}/${fileId}-${file.name}`
        
        const { error: storageError } = await supabase.storage
          .from("project-references")
          .upload(storagePath, file, {
            contentType: file.type,
            upsert: false
          })

        if (storageError) {
          console.error("Storage upload failed:", storageError)
          toast.error(`Upload failed: ${storageError.message}`)
          return
        }

        // 2. Record metadata via Server Action
        const result = await createReferenceDocument(projectId, {
          fileName: file.name,
          fileSize: file.size,
          contentType: file.type,
          storagePath: storagePath
        })

        if (result.success) {
          toast.success("Document uploaded successfully.")
          setOpen(false)
          setFile(null)
        } else {
          // Cleanup storage if DB record fails
          await supabase.storage.from("project-references").remove([storagePath])
          toast.error(result.message)
        }
      } catch (error) {
        console.error("Unexpected error in handleUpload:", error)
        toast.error("An unexpected error occurred during upload.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upload Reference Document</DialogTitle>
          <DialogDescription>
            Documents uploaded here are global to the project and not tied to any specific review.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={!file || isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
