"use client"

import { ListFilter, X } from "lucide-react"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface FilterBarProps {
  table: Table<any>
}

export function FilterBar({ table }: FilterBarProps) {
  const globalFilterValue = table.getState().globalFilter ?? ""
  const hasFilters = table.getState().columnFilters.length > 0 || globalFilterValue

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between py-4">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Input
            placeholder="Search all columns..."
            value={globalFilterValue}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            className="pl-9"
          />
          <ListFilter className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        </div>
        
        {hasFilters && (
          <Button 
            variant="ghost" 
            onClick={() => {
              table.resetColumnFilters()
              table.setGlobalFilter("")
            }}
            className="h-8 px-2 lg:px-3 text-muted-foreground"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
