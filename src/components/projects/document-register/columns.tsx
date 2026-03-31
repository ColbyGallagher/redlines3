"use client"

import { ColumnDef, Column, Table as TanstackTable } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Download, Eye, Trash2, FileText, ArrowUpDown, Filter, Search, X } from "lucide-react"
import type { Document } from "@/lib/db/types"
import { formatBytes, cn } from "@/lib/utils"
import { deleteDocument } from "@/lib/actions/documents"
import { toast } from "sonner"
import Link from "next/link"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { useParams } from "next/navigation"

export type DocumentWithReview = Document & {
  reviews: {
    id: string
    review_name: string
    slug: string
  } | null
}

interface ColumnHeaderProps<TData, TValue> {
  column: Column<TData, TValue>
  title: string
  table: TanstackTable<TData>
}

function ColumnHeader<TData, TValue>({
  column,
  title,
  table,
}: ColumnHeaderProps<TData, TValue>) {
  const [searchValue, setSearchValue] = React.useState((column.getFilterValue() as string) ?? "")

  const uniqueValues = React.useMemo(() => {
    const data = table.options.data
    const values = data.map((row: any) => {
      const val = row[column.id]
      if (column.id === "reviews") return val?.review_name
      return val
    })
    return Array.from(new Set(values)).filter(Boolean).sort() as string[]
  }, [table.getCoreRowModel().flatRows, column.id])

  const handleFilterChange = (value: string | undefined) => {
    column.setFilterValue(value)
    setSearchValue(value ?? "")
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 h-8 gap-1 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {title}
        <ArrowUpDown className="size-3.5" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "size-7 hover:bg-muted",
              column.getFilterValue() ? "text-primary bg-primary/10" : "text-muted-foreground"
            )}
          >
            <Filter className="size-3.5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[200px] p-2" onCloseAutoFocus={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={`Filter ${title}...`}
                  value={searchValue}
                  onChange={(e) => handleFilterChange(e.target.value || undefined)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              {searchValue && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => handleFilterChange(undefined)}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>
            {uniqueValues.length > 0 && (
              <>
                <DropdownMenuSeparator className="-mx-2" />
                <div className="max-h-[200px] overflow-y-auto pt-1">
                  <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Suggestions
                  </p>
                  {uniqueValues.map((val) => (
                    <button
                      key={val}
                      onClick={() => handleFilterChange(searchValue === val ? undefined : val)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-muted text-left",
                        searchValue === val && "bg-muted font-medium text-primary"
                      )}
                    >
                      <div className={cn(
                        "flex size-3.5 items-center justify-center rounded-sm border border-primary",
                        searchValue === val ? "bg-primary text-primary-foreground" : "opacity-50"
                      )}>
                        {searchValue === val && <Filter className="size-2.5" />}
                      </div>
                      <span className="truncate">{val}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            <DropdownMenuSeparator className="-mx-2" />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start text-[10px] font-medium"
              onClick={() => handleFilterChange(undefined)}
            >
              Clear filters
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export const columns: ColumnDef<DocumentWithReview>[] = [
  {
    accessorKey: "document_name",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Document Name" />
    ),
    cell: ({ row }) => {
      const document = row.original
      const params = useParams()
      const projectSlug = params.projectSlug as string
      const reviewSlug = document.reviews?.slug || document.review_id
      const documentId = document.id

      // Use the project slug from the current URL params
      const viewerUrl = (projectSlug && reviewSlug && documentId)
        ? `/${projectSlug}/${reviewSlug}/documents/${documentId}`
        : "#"

      return (
        <div className="flex flex-col gap-0.5">
          <Link 
            href={viewerUrl}
            className="font-medium hover:underline text-primary transition-colors"
          >
            {document.document_name}
          </Link>
          <span className="text-xs text-muted-foreground">{document.document_code || "No code"}</span>
        </div>
      )
    },
  },
  {
    accessorKey: "pdf_url",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="File Type" />
    ),
    cell: ({ row }) => {
      const url = row.original.pdf_url
      const extension = url?.split(".").pop()?.toUpperCase() || "PDF"
      return (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium">{extension}</span>
        </div>
      )
    },
    filterFn: (row, columnId, filterValue: string) => {
      if (!filterValue) return true
      const url = row.original.pdf_url
      const extension = url?.split(".").pop()?.toUpperCase() || "PDF"
      return extension.toLowerCase().includes(filterValue.toLowerCase())
    },
  },
  {
    accessorKey: "uploaded_at",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Upload Date" />
    ),
    cell: ({ row }) => {
      const date = row.original.uploaded_at || row.original.created_at
      if (!date) return <span className="text-muted-foreground">—</span>
      return <span>{new Date(date).toLocaleDateString("en-GB")}</span>
    },
    sortingFn: "datetime",
  },
  {
    accessorKey: "state",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.original.state || "Uploaded"
      
      const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
        "Manual Review": "secondary",
        "Uploaded": "outline",
        "In Review": "default",
        "Approved": "outline",
        "Flagged": "destructive",
      }

      return <Badge variant={variants[status] || "outline"}>{status}</Badge>
    },
    filterFn: (row, columnId, filterValue: string) => {
      if (!filterValue) return true
      const value = row.getValue<string>(columnId)
      return value?.toLowerCase().includes(filterValue.toLowerCase())
    },
  },
  {
    accessorKey: "reviews",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Review" />
    ),
    cell: ({ row }) => {
      const review = row.original.reviews
      if (!review) return <span className="text-muted-foreground">—</span>
      return (
        <span className="text-xs text-muted-foreground">
          {review.review_name}
        </span>
      )
    },
    filterFn: (row, columnId, filterValue: string) => {
      if (!filterValue) return true
      const review = row.original.reviews
      return review?.review_name.toLowerCase().includes(filterValue.toLowerCase()) ?? false
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const document = row.original

      const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this document?")) return
        
        try {
          const result = await deleteDocument(document.id, document.review_id)
          if (result.message === "Success") {
            toast.success("Document deleted successfully")
          } else {
            toast.error(result.message || "Failed to delete document")
          }
        } catch (error) {
          toast.error("An error occurred while deleting the document")
        }
      }

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => window.open(document.pdf_url || "", "_blank")}>
              <Download className="mr-2 h-4 w-4" />
              Download Document
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/reviews/${document.reviews?.slug || document.review_id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View in Review
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
