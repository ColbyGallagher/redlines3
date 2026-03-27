"use client"

import * as React from "react"
import { Plus, FolderPlus, FilePlus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CreateProjectWizard } from "@/components/create-project-wizard"
import { CreateReviewWizard } from "@/components/create-review-wizard"

export function DashboardActions() {
  const [activeWizard, setActiveWizard] = React.useState<"project" | "review" | null>(null)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="gap-2">
            <Plus className="size-4" />
            <span>New</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Create new...</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setActiveWizard("project")} className="gap-2">
            <FolderPlus className="size-4 text-muted-foreground" />
            <span>Project</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setActiveWizard("review")} className="gap-2">
            <FilePlus className="size-4 text-muted-foreground" />
            <span>Review</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateProjectWizard 
        open={activeWizard === "project"} 
        onOpenChange={(open) => !open && setActiveWizard(null)}
        showTrigger={false}
      />
      
      <CreateReviewWizard 
        open={activeWizard === "review"} 
        onOpenChange={(open) => !open && setActiveWizard(null)}
        showTrigger={false}
      />
    </>
  )
}
