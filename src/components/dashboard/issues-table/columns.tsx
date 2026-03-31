"use client"

import { ArrowUpDown, ExternalLink, MoreHorizontal, Filter, Search, X } from "lucide-react"
import type { ColumnDef, Column, Table as TanstackTable } from "@tanstack/react-table"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { ProjectIssueSummary } from "@/lib/data/projects"

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
  const filterValue = (column.getFilterValue() as string[]) ?? []
  const [searchQuery, setSearchQuery] = React.useState("")

  const uniqueValues = React.useMemo(() => {
    const data = table.options.data
    const values = data.map((row: any) => {
      const val = row[column.id]
      return val
    })
    return Array.from(new Set(values)).filter(Boolean).sort() as string[]
  }, [table.options.data, column.id])

  const filteredUniqueValues = React.useMemo(() => {
    return uniqueValues.filter((val) =>
      val.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [uniqueValues, searchQuery])

  const toggleValue = (val: string) => {
    const newFilterValue = filterValue.includes(val)
      ? filterValue.filter((v) => v !== val)
      : [...filterValue, val]
    column.setFilterValue(newFilterValue.length > 0 ? newFilterValue : undefined)
  }

  const handleSelectAll = () => {
    column.setFilterValue(uniqueValues.length > 0 ? uniqueValues : undefined)
  }

  const handleClearAll = () => {
    column.setFilterValue(undefined)
  }

  const isAllSelected = uniqueValues.length > 0 && filterValue.length === uniqueValues.length

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
              filterValue.length > 0 ? "text-primary bg-primary/10" : "text-muted-foreground"
            )}
          >
            <Filter className={cn("size-3.5", filterValue.length > 0 && "fill-current")} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[240px] p-2" onCloseAutoFocus={(e) => e.preventDefault()}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={`Search ${title}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 pl-8 text-xs"
                />
              </div>
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 shrink-0"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="size-3.5" />
                </Button>
              )}
            </div>

            <div className="flex items-center justify-between px-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-medium"
                onClick={handleSelectAll}
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[10px] font-medium text-destructive hover:text-destructive"
                onClick={handleClearAll}
              >
                Clear
              </Button>
            </div>

            <DropdownMenuSeparator className="-mx-2" />
            
            <div className="max-h-[250px] overflow-y-auto pt-1">
              {filteredUniqueValues.length > 0 ? (
                filteredUniqueValues.map((val) => (
                  <button
                    key={val}
                    onClick={() => toggleValue(val)}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-xs transition-colors hover:bg-muted text-left",
                      filterValue.includes(val) && "bg-muted font-medium text-primary"
                    )}
                  >
                    <Checkbox 
                      checked={filterValue.includes(val)}
                      onCheckedChange={() => toggleValue(val)}
                      className="size-3.5"
                    />
                    <span className="truncate">{val}</span>
                  </button>
                ))
              ) : (
                <div className="px-2 py-4 text-center text-xs text-muted-foreground">
                  No results found
                </div>
              )}
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

const multiSelectFilterFn = (row: any, columnId: string, filterValue: string[]) => {
  if (!filterValue || filterValue.length === 0) return true
  const rowValue = row.getValue(columnId)
  return filterValue.includes(rowValue)
}

export const columns: ColumnDef<ProjectIssueSummary>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label={`Select ${row.original.issueNumber}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
  },
  {
    accessorKey: "issueNumber",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Issue #" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-xs">{row.getValue("issueNumber")}</div>
    ),
  },
  {
    accessorKey: "projectName",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Project" />
    ),
    filterFn: multiSelectFilterFn,
    cell: ({ row, table }) => {
      const projectSlug = row.original.projectSlug
      const projectName = row.original.projectName
      const navigateProject = (table.options.meta as any)?.navigateProject

      return (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            navigateProject?.(projectSlug, row.original)
          }}
          className="inline-flex items-center gap-1 text-left font-medium text-foreground transition hover:underline"
        >
          <span className="truncate max-w-[150px]">{projectName}</span>
          <ExternalLink className="size-3" aria-hidden />
        </button>
      )
    },
  },
  {
    accessorKey: "reviewName",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Review" />
    ),
    filterFn: multiSelectFilterFn,
    cell: ({ row, table }) => {
      const reviewSlug = row.original.reviewSlug
      const reviewName = row.original.reviewName
      const navigateReview = (table.options.meta as any)?.navigateReview

      return (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            navigateReview?.(reviewSlug, row.original)
          }}
          className="inline-flex items-center gap-1 text-left font-medium text-foreground transition hover:underline"
        >
          <span className="truncate max-w-[150px]">{reviewName}</span>
          <ExternalLink className="size-3" aria-hidden />
        </button>
      )
    },
  },
  {
    accessorKey: "comment",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Comment" />
    ),
    filterFn: multiSelectFilterFn,
    cell: ({ row }) => (
      <div className="max-w-[300px] truncate text-xs text-muted-foreground" title={row.getValue("comment")}>
        {row.getValue("comment")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Status" />
    ),
    filterFn: multiSelectFilterFn,
    cell: ({ row }) => {
      const status = row.getValue<string>("status")
      return (
        <Badge variant={status === "Closed" || status === "Resolved" ? "secondary" : "default"} className="capitalize">
          {status}
        </Badge>
      )
    },
  },
  {
    accessorKey: "importance",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Importance" />
    ),
    filterFn: multiSelectFilterFn,
    cell: ({ row }) => {
      const importance = row.getValue<string>("importance")
      return (
        <Badge variant={importance === "High" ? "destructive" : "outline"} className="capitalize">
          {importance}
        </Badge>
      )
    },
  },
  {
    accessorKey: "discipline",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Discipline" />
    ),
    filterFn: multiSelectFilterFn,
  },
  {
    accessorKey: "state",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="State" />
    ),
    filterFn: multiSelectFilterFn,
    cell: ({ row }) => <div className="text-xs">{row.getValue("state") || "—"}</div>,
  },
  {
    accessorKey: "classification",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Classification" />
    ),
    filterFn: multiSelectFilterFn,
    cell: ({ row }) => <div className="text-xs">{row.getValue("classification") || "—"}</div>,
  },
  {
    accessorKey: "milestone",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Milestone" />
    ),
    filterFn: multiSelectFilterFn,
    cell: ({ row }) => <div className="text-xs">{row.getValue("milestone") || "—"}</div>,
  },
  {
    accessorKey: "package",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Package" />
    ),
    filterFn: multiSelectFilterFn,
    cell: ({ row }) => <div className="text-xs">{row.getValue("package") || "—"}</div>,
  },
  {
    accessorKey: "authorName",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Created by" />
    ),
    filterFn: multiSelectFilterFn,
  },
  {
    accessorKey: "dateCreated",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Date" />
    ),
    cell: ({ row }) => {
      const val = row.getValue<string>("dateCreated")
      if (!val) return "—"
      return new Date(val).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    },
    sortingFn: "datetime",
  },
  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row, table }) => {
      const reviewSlug = row.original.reviewSlug
      const navigateReview = (table.options.meta as any)?.navigateReview

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="size-8 p-0">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Open row actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigateReview?.(reviewSlug, row.original)}>
              View in viewer
            </DropdownMenuItem>
            <DropdownMenuItem>Add comment</DropdownMenuItem>
            <DropdownMenuItem>Assign member</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Flag for internal</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
