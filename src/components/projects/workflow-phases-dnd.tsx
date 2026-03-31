"use client"

import * as React from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { updatePhaseOrder, updatePhasePermissions } from "@/lib/actions/workflow"
import { toast } from "sonner"
import type { ProjectReviewPhase } from "@/lib/db/types"

interface WorkflowPhasesDndProps {
  projectId: string
  phases: ProjectReviewPhase[]
  onEdit: (phase: ProjectReviewPhase) => void
  onDelete: (phase: ProjectReviewPhase) => void
}

const ROLES = ["admin", "developer", "reviewer", "designer", "viewer"]
const CAPABILITIES = [
  { id: "view", label: "View" },
  { id: "edit_own", label: "Edit Own Issues" },
  { id: "edit_others", label: "Edit Others Issues" },
]

export function WorkflowPhasesDnd({ projectId, phases, onEdit, onDelete }: WorkflowPhasesDndProps) {
  const [items, setItems] = React.useState(phases)
  const [isPending, startTransition] = React.useTransition()
  const [permissionsDialogOpen, setPermissionsDialogOpen] = React.useState(false)
  const [selectedPhase, setSelectedPhase] = React.useState<ProjectReviewPhase | null>(null)

  // Sync internal state when props change
  React.useEffect(() => {
    setItems([...phases].sort((a, b) => (a.order_index || 0) - (b.order_index || 0)))
  }, [phases])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id)
      const newIndex = items.findIndex((item) => item.id === over.id)
      
      const newOrder = arrayMove(items, oldIndex, newIndex)
      const previousOrder = [...items]
      setItems(newOrder)

      startTransition(async () => {
        const result = await updatePhaseOrder(projectId, newOrder.map(i => i.id))
        if (result.success) {
            toast.success("Order updated")
        } else {
            toast.error("Failed to save new order")
            setItems(previousOrder) // rollback
        }
      })
    }
  }

  const handlePermissionsClick = (phase: ProjectReviewPhase) => {
    setSelectedPhase(phase)
    setPermissionsDialogOpen(true)
  }

  const handleSavePermissions = (phaseId: string, newPermissions: { roles: Record<string, string[]>, companies: string[] }) => {
    const previousItems = [...items]
    const updatedItems = items.map(item => 
      item.id === phaseId ? { ...item, permissions: newPermissions } : item
    )
    setItems(updatedItems)

    startTransition(async () => {
      const result = await updatePhasePermissions(projectId, phaseId, newPermissions)
      if (result.success) {
          toast.success("Permissions updated")
          setPermissionsDialogOpen(false)
      } else {
          toast.error(result.error || "Failed to update permissions")
          setItems(previousItems) // rollback
      }
    })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 py-4">
          {items.map((phase) => (
            <SortableItem 
              key={phase.id} 
              phase={phase} 
              onEdit={() => onEdit(phase)} 
              onDelete={() => onDelete(phase)}
              onPermissions={() => handlePermissionsClick(phase)}
              isPending={isPending}
            />
          ))}
        </div>
      </SortableContext>

      <PhasePermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        phase={selectedPhase}
        projectId={projectId}
        onSave={(newPerms) => selectedPhase && handleSavePermissions(selectedPhase.id, newPerms)}
        isPending={isPending}
      />
    </DndContext>
  )
}

function SortableItem({ 
    phase, 
    onEdit, 
    onDelete, 
    onPermissions,
    isPending
}: { 
    phase: ProjectReviewPhase, 
    onEdit: () => void, 
    onDelete: () => void,
    onPermissions: () => void,
    isPending: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: phase.id })

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="touch-none">
      <Card className={`shadow-sm ${isDragging ? "border-primary" : ""}`}>
        <CardContent className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-muted-foreground p-1 hover:bg-muted rounded transition-colors">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="font-medium">{phase.phase_name}</span>
              <span className="text-xs text-muted-foreground">{phase.duration_days} days</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={onPermissions} disabled={isPending}>
              Permissions
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Phase
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Phase
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function PhasePermissionsDialog({
  open,
  onOpenChange,
  phase,
  projectId,
  onSave,
  isPending
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  phase: ProjectReviewPhase | null
  projectId: string
  onSave: (permissions: { roles: Record<string, string[]>, companies: string[] }) => void
  isPending: boolean
}) {
  const [localPermissions, setLocalPermissions] = React.useState<Record<string, string[]>>({})
  const [selectedCompanies, setSelectedCompanies] = React.useState<string[]>([])
  const [projectCompanies, setProjectCompanies] = React.useState<any[]>([])
  const [isLoadingCompanies, setIsLoadingCompanies] = React.useState(false)

  React.useEffect(() => {
    if (open && projectId) {
      setIsLoadingCompanies(true)
      Promise.all([
        fetch("/api/companies").then(res => res.json()),
        fetch(`/api/projects/${projectId}/settings`).then(res => res.json())
      ]).then(([allCompanies, projectSettings]) => {
        const linkedCompanyIds: string[] = projectSettings.settings?.companies || []
        const linkedCompanies = (allCompanies || []).filter((c: any) => linkedCompanyIds.includes(c.id))
        setProjectCompanies(linkedCompanies)
      }).finally(() => {
        setIsLoadingCompanies(false)
      })
    }
  }, [open, projectId])

  React.useEffect(() => {
    if (phase) {
      if (phase.permissions && "roles" in phase.permissions) {
        setLocalPermissions(phase.permissions.roles || {})
        setSelectedCompanies(phase.permissions.companies || [])
      } else {
        setLocalPermissions(phase.permissions as any || {})
      }
    }
  }, [phase])

  React.useEffect(() => {
    if (phase && projectCompanies.length > 0) {
      const hasExplicitCompanies = phase.permissions && "companies" in phase.permissions
      if (!hasExplicitCompanies) {
        setSelectedCompanies(projectCompanies.map(c => c.id))
      }
    }
  }, [projectCompanies, phase])

  const togglePermission = (role: string, capability: string) => {
    const current = localPermissions[role] || []
    const updated = current.includes(capability)
      ? current.filter(c => c !== capability)
      : [...current, capability]
    
    setLocalPermissions({
      ...localPermissions,
      [role]: updated
    })
  }

  const handleFullAccess = () => {
    const full: Record<string, string[]> = {}
    ROLES.forEach(role => {
      full[role] = ["view", "edit_own", "edit_others"]
    })
    setLocalPermissions(full)
    setSelectedCompanies(projectCompanies.map(c => c.id))
  }

  const toggleCompany = (companyId: string) => {
    setSelectedCompanies(prev => {
      if (prev.includes(companyId)) {
        if (prev.length <= 1) {
          toast.error("At least one company must have access")
          return prev
        }
        return prev.filter(id => id !== companyId)
      }
      return [...prev, companyId]
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Phase Permissions: {phase?.phase_name}</DialogTitle>
          <DialogDescription>
            Restrict access to specific companies or roles during this phase. Project and Org Admins always have full access.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Companies with access</h4>
            {isLoadingCompanies ? (
              <div className="text-sm text-muted-foreground animate-pulse">Loading project companies...</div>
            ) : projectCompanies.length > 0 ? (
              <div className="flex flex-wrap gap-4 p-3 border rounded-md bg-muted/30">
                {projectCompanies.map((company) => (
                  <div key={company.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`company-${company.id}`}
                      checked={selectedCompanies.includes(company.id)}
                      onCheckedChange={() => toggleCompany(company.id)}
                    />
                    <label 
                      htmlFor={`company-${company.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {company.name}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground border border-dashed rounded-md p-3 text-center">
                No companies are currently associated with this project. Edit project settings to add companies.
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Role Permissions</h4>
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Role</TableHead>
                    {CAPABILITIES.map(cap => (
                      <TableHead key={cap.id} className="text-center">{cap.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ROLES.map(role => (
                    <TableRow key={role}>
                      <TableCell className="font-medium capitalize">{role}</TableCell>
                      {CAPABILITIES.map(cap => (
                        <TableCell key={cap.id} className="text-center">
                          <Checkbox
                            checked={(localPermissions[role] || []).includes(cap.id)}
                            onCheckedChange={() => togglePermission(role, cap.id)}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          <Button variant="ghost" size="sm" onClick={handleFullAccess} type="button">
            Give Everyone Full Access
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} type="button" disabled={isPending}>
              Cancel
            </Button>
            <Button size="sm" onClick={() => onSave({ roles: localPermissions, companies: selectedCompanies })} type="button" disabled={isPending || isLoadingCompanies}>
              {isPending ? "Saving..." : "Save Permissions"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
