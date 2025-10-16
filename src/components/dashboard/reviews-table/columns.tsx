"use client"

import { ArrowUpDown, ExternalLink, MoreHorizontal } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"

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

  return `${MONTH_LABELS[monthIndex]} ${dayNumber}, ${year}`
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
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 flex items-center gap-1"
      >
        Review name
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("reviewName")}</div>
    ),
  },
  {
    accessorKey: "project",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 flex items-center gap-1"
      >
        Project
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row, table }) => {
      const project = row.original.project
      const navigateProject = table.options.meta?.navigateProject as ((id: string) => void) | undefined

      if (!project) {
        return <span className="text-muted-foreground">—</span>
      }

      return (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            navigateProject?.(project.id)
          }}
          className="inline-flex items-center gap-1 text-left font-medium text-foreground transition hover:underline"
        >
          {project.name}
          <ExternalLink className="size-3" aria-hidden />
          <span className="sr-only">Open {project.name}</span>
        </button>
      )
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 flex items-center gap-1"
      >
        Due date
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const value = row.getValue<string>("dueDate")
      return <span>{value ? formatDateLabel(value) : "—"}</span>
    },
    sortingFn: "datetime",
  },
  {
    accessorKey: "milestone",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 flex items-center gap-1"
      >
        Milestone
        <ArrowUpDown className="size-4" />
      </Button>
    ),
  },
  {
    accessorKey: "status",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 flex items-center gap-1"
      >
        Status
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const status = row.getValue<string>("status")
      return <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">{status}</span>
    },
    filterFn: (row, columnId, filterValue: string[]) => {
      if (!filterValue?.length) return true
      const value = row.getValue<string>(columnId)
      return filterValue.includes(value)
    },
  },
  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row, table }) => {
      const review = row.original
      const navigate = table.options.meta?.navigate as ((id: string) => void) | undefined

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
            <DropdownMenuItem onClick={() => navigate?.(review.id)}>
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

