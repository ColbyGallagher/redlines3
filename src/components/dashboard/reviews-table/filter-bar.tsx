"use client"

import { useMemo } from "react"
import { Settings2, ListFilter } from "lucide-react"
import { Table } from "@tanstack/react-table"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ReviewRecord } from "./data"

type FilterBarProps = {
  table: Table<ReviewRecord>
}

export function FilterBar({ table }: FilterBarProps) {
  const searchableColumns = useMemo(() => ["reviewName", "project", "coordinator"], [])

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 items-center gap-2">
        <div className="relative w-full max-w-sm">
          <Input
            placeholder="Filter reviews..."
            value={(table.getColumn(searchableColumns[0])?.getFilterValue() as string) ?? ""}
            onChange={(event) => {
              searchableColumns.forEach((key) => {
                table.getColumn(key)?.setFilterValue(event.target.value)
              })
            }}
            className="pl-9"
          />
          <ListFilter className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        </div>
        <Separator orientation="vertical" className="hidden h-6 lg:block" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings2 className="size-4" />
              Status
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel>Status filter</DropdownMenuLabel>
            {[
              "Draft",
              "In Review",
              "Awaiting Client",
              "Approved",
              "Flagged",
            ].map((status) => {
              const column = table.getColumn("status")
              const currentValue = (column?.getFilterValue() as string[]) ?? []
              const checked = currentValue.includes(status)

              return (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={checked}
                  onCheckedChange={(isChecked) => {
                    const next = isChecked
                      ? [...currentValue, status]
                      : currentValue.filter((value) => value !== status)
                    column?.setFilterValue(next.length ? next : undefined)
                  }}
                  className="capitalize"
                >
                  {status.toLowerCase()}
                </DropdownMenuCheckboxItem>
              )
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="secondary">New review</Button>
        <Button variant="outline">Bulk update</Button>
      </div>
    </div>
  )
}

