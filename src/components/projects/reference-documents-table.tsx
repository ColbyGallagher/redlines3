"use client"

import { useTransition } from "react"
import { deleteReferenceDocument, getReferenceDocumentSignedUrl } from "@/lib/actions/reference-documents"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Trash2, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { formatBytes } from "@/lib/utils"

interface ReferenceDocumentsTableProps {
  documents: any[]
  projectId: string
}

export function ReferenceDocumentsTable({ documents, projectId }: ReferenceDocumentsTableProps) {
  const [isPending, startTransition] = useTransition()

  const handleDownload = async (storagePath: string, fileName: string) => {
    const signedUrl = await getReferenceDocumentSignedUrl(storagePath)
    if (signedUrl) {
      window.open(signedUrl, "_blank")
    } else {
      toast.error("Failed to generate download link.")
    }
  }

  const handleDelete = async (documentId: string, storagePath: string) => {
    startTransition(async () => {
      const result = await deleteReferenceDocument(documentId, storagePath, projectId)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    })
  }

  if (documents.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
        No reference documents uploaded yet.
      </div>
    )
  }

  return (
    <div className="relative rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>Uploaded By</TableHead>
            <TableHead>Upload Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map((doc) => (
            <TableRow key={doc.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                  {doc.file_name}
                </div>
              </TableCell>
              <TableCell>{formatBytes(doc.file_size)}</TableCell>
              <TableCell>
                {doc.user ? `${doc.user.first_name} ${doc.user.last_name}` : "Unknown"}
              </TableCell>
              <TableCell>
                {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDownload(doc.storage_path, doc.file_name)}
                  >
                    <Download className="h-4 w-4" />
                    <span className="sr-only">Download</span>
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Are you absolutely sure?</DialogTitle>
                        <DialogDescription>
                          This action cannot be undone. This will permanently delete the reference document "{doc.file_name}".
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()}>
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDelete(doc.id, doc.storage_path)}
                        >
                          Delete
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/50">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
    </div>
  )
}
