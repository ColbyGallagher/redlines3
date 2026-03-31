"use client"

import * as React from "react"
import {
  ColumnDef,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ReviewUser } from "@/lib/data/reviews"
import { Trash2, ShieldCheck, UserMinus, Users, MoreHorizontal, ArrowUpDown, ListFilter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AddProjectUserDialog } from "./add-project-user-dialog"
import { RemoveProjectUserDialog } from "./remove-project-user-dialog"
import { updateProjectUserRole, bulkUpdateProjectUserRoles } from "@/lib/actions/project-users"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface ProjectUsersSettingsProps {
  projectId: string
  members: ReviewUser[]
}

const PROJECT_ROLES = ["Admin", "Reviewer", "Client", "Consultant"]

export function ProjectUsersSettings({ projectId, members }: ProjectUsersSettingsProps) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [rowSelection, setRowSelection] = React.useState({})
  const [usersToRemove, setUsersToRemove] = React.useState<ReviewUser[]>([])
  const [isRemoveOpen, setIsRemoveOpen] = React.useState(false)
  const [isUpdating, setIsUpdating] = React.useState<string | null>(null)

  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsUpdating(userId)
    try {
      const result = await updateProjectUserRole(projectId, userId, newRole)
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (e) {
      toast.error("Failed to update role")
    } finally {
      setIsUpdating(null)
    }
  }

  const columns: ColumnDef<ReviewUser>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorFn: (row) => `${row.firstName} ${row.lastName}`,
      id: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 gap-2"
        >
          Person
          <ArrowUpDown className="size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="font-medium whitespace-nowrap">
          {row.original.firstName} {row.original.lastName}
        </div>
      ),
    },
    {
      accessorKey: "company",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 gap-2"
        >
          Company
          <ArrowUpDown className="size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded border border-muted-foreground/10">
                {row.original.company || "Independent"}
            </span>
        </div>
      ),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 gap-2"
        >
          Permission Level
          <ArrowUpDown className="size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap">
          <Select 
            defaultValue={row.original.role || "Reviewer"} 
            onValueChange={(v) => handleRoleChange(row.original.id, v)}
            disabled={isUpdating === row.original.id}
          >
            <SelectTrigger className="h-8 py-0 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_ROLES.map(role => (
                <SelectItem key={role} value={role}>{role}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 gap-2"
        >
          Email
          <ArrowUpDown className="size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="whitespace-nowrap font-mono text-[10px] text-muted-foreground">
          {row.getValue("email")}
        </div>
      ),
    },
    {
      accessorKey: "jobTitle",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="-ml-4 h-8 gap-2"
        >
          Job Title
          <ArrowUpDown className="size-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="text-muted-foreground whitespace-nowrap text-sm">
          {row.getValue("jobTitle") || "-"}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original
        return (
          <div className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive gap-2"
                  onClick={() => handleRemoveSingle(user)}
                >
                  <Trash2 className="size-4" />
                  Remove from project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false,
    },
  ]

  const table = useReactTable({
    data: members,
    columns,
    state: {
      sorting,
      globalFilter,
      rowSelection,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
  })

  const selectedRows = table.getSelectedRowModel().rows
  const selectedMemberIds = selectedRows.map(row => row.original.id)

  const handleBulkRoleChange = async (newRole: string) => {
    if (selectedMemberIds.length === 0) return
    
    const promise = bulkUpdateProjectUserRoles(projectId, selectedMemberIds, newRole)
    toast.promise(promise, {
      loading: `Updating roles for ${selectedMemberIds.length} users...`,
      success: (res) => {
        if (res.success) {
            setRowSelection({})
            return res.message
        }
        throw new Error(res.message)
      },
      error: (e) => `Error: ${e.message}`,
    })
  }

  const handleRemoveSingle = (user: ReviewUser) => {
    setUsersToRemove([user])
    setIsRemoveOpen(true)
  }

  const handleRemoveBulk = () => {
    const users = selectedRows.map(row => row.original)
    setUsersToRemove(users)
    setIsRemoveOpen(true)
  }

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
        <div className="space-y-1.5 focus-within:ring-0">
          <CardTitle>Project Users</CardTitle>
          <CardDescription>
            Manage project access and permissions for team members.
          </CardDescription>
        </div>
        <AddProjectUserDialog 
          projectId={projectId} 
          existingMemberIds={members.map(m => m.id)} 
        />
      </CardHeader>

      {/* Bulk Actions Bar */}
      {selectedMemberIds.length > 0 && (
        <div className="absolute top-[88px] left-0 right-0 z-10 mx-6 bg-primary rounded-lg shadow-lg border border-primary-foreground/10 animate-in slide-in-from-top-4 duration-300">
           <div className="px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary-foreground/20 rounded px-2 py-0.5 text-xs font-bold text-primary-foreground">
                    {selectedMemberIds.length} SELECTED
                </div>
                <div className="h-4 w-[1px] bg-primary-foreground/20" />
              </div>
              
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="secondary" size="sm" className="h-8 gap-2 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 border-0">
                        <ShieldCheck className="size-3.5" />
                        Assign Role
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {PROJECT_ROLES.map(role => (
                        <DropdownMenuItem key={role} onClick={() => handleBulkRoleChange(role)}>
                            To {role}
                        </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 gap-2 text-primary-foreground hover:bg-destructive hover:text-white transition-colors"
                    onClick={handleRemoveBulk}
                >
                    <UserMinus className="size-3.5" />
                    Remove Users
                </Button>
                
                <div className="h-4 w-[1px] bg-primary-foreground/20 mx-1" />
                
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-primary-foreground/70 hover:bg-transparent hover:text-primary-foreground"
                    onClick={() => setRowSelection({})}
                >
                    Cancel
                </Button>
              </div>
           </div>
        </div>
      )}

      <CardContent className="space-y-4">
        {/* Filter Bar */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative w-full max-w-sm">
              <Input
                placeholder="Search team members..."
                value={globalFilter}
                onChange={(event) => setGlobalFilter(event.target.value)}
                className="pl-9"
              />
              <ListFilter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
            
            {globalFilter && (
              <Button 
                variant="ghost" 
                onClick={() => setGlobalFilter("")}
                className="h-8 px-2 lg:px-3 text-muted-foreground"
              >
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className={cn(
            "rounded-md border transition-all duration-300",
            selectedMemberIds.length > 0 && "mt-12"
        )}>
          <Table>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow 
                    key={row.id} 
                    className={cn(
                        "transition-colors",
                        row.getIsSelected() && "bg-muted/30"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No users found for this project.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="text-xs text-muted-foreground">
            {table.getFilteredRowModel().rows.length} members total
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <div className="text-[10px] text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>

        <RemoveProjectUserDialog 
          open={isRemoveOpen}
          onOpenChange={setIsRemoveOpen}
          projectId={projectId}
          users={usersToRemove}
          allProjectMembers={members}
          onSuccess={() => setRowSelection({})}
        />
      </CardContent>
    </Card>
  )
}
