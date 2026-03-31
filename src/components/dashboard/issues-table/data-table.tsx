"use client"

import { useMemo, useState, useCallback, type KeyboardEvent } from "react"
import { useRouter } from "next/navigation"
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { columns } from "./columns"
import type { ProjectIssueSummary } from "@/lib/data/projects"

type DataTableProps = {
  data: ProjectIssueSummary[]
  initialAuthorFilter?: string
}

export function IssuesDataTable({ data, initialAuthorFilter }: DataTableProps) {
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([{ id: "dateCreated", desc: true }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialAuthorFilter ? [{ id: "authorName", value: initialAuthorFilter }] : []
  )
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    discipline: false,
  })
  const [rowSelection, setRowSelection] = useState({})
  const [columnSizing, setColumnSizing] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 50,
  })

  const navigateReview = useCallback((reviewSlug: string, row?: ProjectIssueSummary) => {
    const projectSlug = row?.projectSlug || ""
    router.push(`/${projectSlug}/${reviewSlug}`)
  }, [router])

  const navigateProject = useCallback((projectSlug: string) => {
    router.push(`/${projectSlug}`)
  }, [router])

  const handleRowKeyDown = useCallback((event: KeyboardEvent<HTMLTableRowElement>, row: ProjectIssueSummary) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      navigateReview(row.reviewSlug, row)
    }
  }, [navigateReview])

  const table = useReactTable<ProjectIssueSummary>({
    data,
    columns,
    columnResizeMode: "onChange",
    onColumnSizingChange: setColumnSizing,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
      columnSizing,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      navigateReview,
      navigateProject,
    },
  })

  const selectedCount = useMemo(() => table.getSelectedRowModel().rows.length, [table])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Columns
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllLeafColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                  className="capitalize"
                >
                  {column.id.replace(/([A-Z])/g, " $1").toLowerCase()}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-lg border">
        <Table style={{ tableLayout: "fixed", width: table.getTotalSize() }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id} 
                    className="group relative overflow-hidden text-ellipsis whitespace-nowrap" 
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={cn(
                          "absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-border opacity-0 transition-opacity group-hover:opacity-100",
                          header.column.getIsResizing() && "bg-primary opacity-100"
                        )}
                      />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => navigateReview(row.original.reviewSlug, row.original)}
                  onKeyDown={(event) => handleRowKeyDown(event, row.original)}
                  tabIndex={0}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id} 
                      className="overflow-hidden text-ellipsis whitespace-nowrap"
                      style={{ width: cell.column.getSize() }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm text-muted-foreground">
                  No issues found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div>
          {selectedCount} selected of {table.getFilteredRowModel().rows.length} shown
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.resetColumnVisibility()}
          >
            Reset columns
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() => table.previousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!table.getCanNextPage()}
              onClick={() => table.nextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
