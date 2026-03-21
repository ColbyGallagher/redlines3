"use client"

import * as React from "react"
import { toast } from "sonner"
import { getProjectPhases, addPhase, updatePhase, deletePhase } from "@/lib/actions/workflow"
import type { ProjectReviewPhase } from "@/lib/db/types"
import { WorkflowPhasesDnd } from "./workflow-phases-dnd"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface WorkflowSettingsProps {
    projectId: string
}

export function WorkflowSettings({ projectId }: WorkflowSettingsProps) {
    const [phases, setPhases] = React.useState<ProjectReviewPhase[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isPending, startTransition] = React.useTransition()
    
    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [currentItem, setCurrentItem] = React.useState<{ id?: string; phase_name: string; duration_days: number; state: "Active" | "Complete" | "Archived" } | null>(null)
    const [itemToDelete, setItemToDelete] = React.useState<{ id: string; name: string } | null>(null)

    const loadPhases = React.useCallback(async () => {
        const result = await getProjectPhases(projectId)
        if (result.success && result.phases) {
            setPhases(result.phases)
        }
        setIsLoading(false)
    }, [projectId])

    React.useEffect(() => {
        loadPhases()
    }, [loadPhases])

    const handleAddPhaseClick = () => {
        setCurrentItem({ phase_name: "", duration_days: 5, state: "Active" })
        setIsDialogOpen(true)
    }

    const handleEditPhaseClick = (phase: ProjectReviewPhase) => {
        setCurrentItem({ 
            id: phase.id, 
            phase_name: phase.phase_name, 
            duration_days: phase.duration_days,
            state: phase.state || "Active"
        })
        setIsDialogOpen(true)
    }

    const handleDeletePhaseClick = (phase: ProjectReviewPhase) => {
        setItemToDelete({ id: phase.id, name: phase.phase_name })
        setIsDeleteDialogOpen(true)
    }

    const onSavePhase = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!currentItem) return

        startTransition(async () => {
            const result = currentItem.id
                ? await updatePhase(projectId, currentItem.id, { 
                    phase_name: currentItem.phase_name, 
                    duration_days: currentItem.duration_days,
                    state: currentItem.state
                  })
                : await addPhase(projectId, currentItem.phase_name, currentItem.duration_days, currentItem.state)

            if (result.success) {
                toast.success(`Successfully ${currentItem.id ? "updated" : "added"} phase`)
                setIsDialogOpen(false)
                setCurrentItem(null)
                loadPhases() // Refresh list
            } else {
                toast.error(result.error || "An error occurred")
            }
        })
    }

    const onConfirmDeletePhase = async () => {
        if (!itemToDelete) return

        startTransition(async () => {
            const result = await deletePhase(projectId, itemToDelete.id)
            if (result.success) {
                toast.success("Successfully deleted phase")
                setIsDeleteDialogOpen(false)
                setItemToDelete(null)
                loadPhases() // Refresh list
            } else {
                toast.error(result.error || "An error occurred")
            }
        })
    }

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading review phases...</div>
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Project Review Phases</CardTitle>
                        <CardDescription>
                            Define the phases of your design review, their order, and which roles can edit issues during each phase.
                        </CardDescription>
                    </div>
                    <Button onClick={handleAddPhaseClick} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Phase
                    </Button>
                </CardHeader>
                <CardContent>
                    <WorkflowPhasesDnd 
                        projectId={projectId} 
                        phases={phases} 
                        onEdit={handleEditPhaseClick} 
                        onDelete={handleDeletePhaseClick} 
                    />
                </CardContent>
            </Card>

            {/* Add/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <form onSubmit={onSavePhase}>
                        <DialogHeader>
                            <DialogTitle>{currentItem?.id ? "Edit" : "Add"} Review Phase</DialogTitle>
                            <DialogDescription>
                                Configure the name and expected duration for this phase.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phase-name">Phase Name</Label>
                                <Input
                                    id="phase-name"
                                    value={currentItem?.phase_name || ""}
                                    onChange={(e) => setCurrentItem(prev => ({ ...prev!, phase_name: e.target.value }))}
                                    placeholder="e.g. SME Review"
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="duration">Duration (Days)</Label>
                                <Input
                                    id="duration"
                                    type="number"
                                    value={currentItem?.duration_days || 5}
                                    onChange={(e) => setCurrentItem(prev => ({ ...prev!, duration_days: parseInt(e.target.value) || 0 }))}
                                    min={1}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phase-state">Phase State</Label>
                                <Select 
                                    value={currentItem?.state || "Active"} 
                                    onValueChange={(v: "Active" | "Complete" | "Archived") => setCurrentItem(prev => ({ ...prev!, state: v }))}
                                >
                                    <SelectTrigger id="phase-state">
                                        <SelectValue placeholder="Select state" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Complete">Complete</SelectItem>
                                        <SelectItem value="Archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Phase</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{itemToDelete?.name}"? This will remove the phase from the review timeline.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={onConfirmDeletePhase} disabled={isPending}>
                            {isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
