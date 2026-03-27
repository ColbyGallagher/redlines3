"use client"

import { ArrowUpDown, ExternalLink, MoreHorizontal } from "lucide-react"
import { ColumnDef } from "@tanstack/react-table"
import Link from "next/link"

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
import type { ProjectSummary } from "@/lib/data/projects"

export const columns: ColumnDef<ProjectSummary>[] = [
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
        aria-label={`Select ${row.original.project.projectName}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
  },
  {
    accessorKey: "projectName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 flex items-center gap-1"
      >
        Project name
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const projectName = row.original.project.projectName
      return <div className="font-medium">{projectName}</div>
    },
    accessorFn: (row) => row.project.projectName,
  },
  {
    accessorKey: "projectNumber",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 flex items-center gap-1"
      >
        Number
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      return <div className="font-mono text-xs">{row.original.project.projectNumber}</div>
    },
    accessorFn: (row) => row.project.projectNumber,
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
      const status = row.original.project.status ?? "Unknown"
      return (
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium capitalize">
          {status}
        </span>
      )
    },
    accessorFn: (row) => row.project.status,
  },
  {
    id: "openReviews",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 flex items-center gap-1"
      >
        Open Reviews
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      // In Redlines, 'open' reviews are those in specific statuses
      const activeStatuses = new Set(["Draft", "In Review", "Awaiting Client", "Flagged"])
      const openCount = row.original.reviews.filter(r => activeStatuses.has(r.status)).length
      
      return (
        <div className="flex items-center gap-2">
          <span className="font-medium">{openCount}</span>
          {openCount > 0 && <span className="size-2 rounded-full bg-blue-500" />}
        </div>
      )
    },
    accessorFn: (row) => row.reviews.length, // Sort by total reviews as a proxy or fix later
  },
  {
    accessorKey: "lastUpdated",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="-ml-2 flex items-center gap-1"
      >
        Last Updated
        <ArrowUpDown className="size-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const date = new Date(row.original.lastUpdated)
      return (
        <span className="text-muted-foreground">
          {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </span>
      )
    },
    sortingFn: "datetime",
  },
  {
    id: "actions",
    enableSorting: false,
    enableHiding: false,
    cell: ({ row }) => {
      const project = row.original.project

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
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}`}>View dashboard</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/projects/${project.id}/settings`}>Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Archive project</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
