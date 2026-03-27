"use client"

import { ArrowUpDown, ExternalLink, MoreHorizontal, Filter, Search, X } from "lucide-react"
import { ColumnDef, Column, Table as TanstackTable } from "@tanstack/react-table"
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
import { cn } from "@/lib/utils"
import type { ReviewSummary } from "@/lib/data/reviews"

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

function formatDateLabel(value: string) {
  const parts = value.split("-")
  if (parts.length !== 3) return value
  const [year, month, day] = parts
  const monthIndex = Number.parseInt(month, 10) - 1
  const dayNumber = Number.parseInt(day, 10)

  if (Number.isNaN(monthIndex) || Number.isNaN(dayNumber) || monthIndex < 0 || monthIndex > 11) {
    return value
  }

  return `${dayNumber} ${MONTH_LABELS[monthIndex]} ${year}`
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
      if (typeof val === "object" && val?.name) return val.name
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

export const columns: ColumnDef<ReviewSummary>[] = [
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
        aria-label={`Select ${row.original.reviewName}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
  },
  {
    accessorKey: "reviewName",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Review name" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("reviewName")}</div>
    ),
  },
  {
    accessorKey: "project",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Project" />
    ),
    cell: ({ row, table }) => {
      const project = row.original.project
      const navigateProject = table.options.meta?.navigateProject

      if (!project) {
        return <span className="text-muted-foreground">—</span>
      }

      return (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            navigateProject?.(project.id, row.original)
          }}
          className="inline-flex items-center gap-1 text-left font-medium text-foreground transition hover:underline"
        >
          {project.name}
          <ExternalLink className="size-3" aria-hidden />
          <span className="sr-only">Open {project.name}</span>
        </button>
      )
    },
    filterFn: (row, columnId, filterValue: string) => {
      const project = row.original.project
      if (!project) return false
      return project.name.toLowerCase().includes(filterValue.toLowerCase())
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Due date" />
    ),
    cell: ({ row }) => {
      const value = row.getValue<string>("dueDate")
      return <span>{value ? formatDateLabel(value) : "—"}</span>
    },
    sortingFn: "datetime",
  },
  {
    accessorKey: "milestone",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Milestone" />
    ),
  },
  {
    accessorKey: "status",
    header: ({ column, table }) => (
      <ColumnHeader column={column} table={table} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue<string>("status")
      return <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">{status}</span>
    },
    filterFn: (row, columnId, filterValue: string) => {
      if (!filterValue) return true
      const value = row.getValue<string>(columnId)
      return value.toLowerCase().includes(filterValue.toLowerCase())
    },
  },
  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row, table }) => {
      const review = row.original
      const navigateReview = table.options.meta?.navigateReview

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
            <DropdownMenuItem onClick={() => navigateReview?.(review.id, review)}>
              View details
            </DropdownMenuItem>
            <DropdownMenuItem>Share with team</DropdownMenuItem>
            <DropdownMenuItem>Duplicate review</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

