"use client"

import * as React from "react"
import { toast } from "sonner"
import { getProjectPhases, addPhase, updatePhase, deletePhase, getProjectWorkflows, createWorkflow, updateWorkflow, deleteWorkflow } from "@/lib/actions/workflow"
import type { ProjectReviewPhase, ProjectWorkflow } from "@/lib/db/types"
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
    const [workflows, setWorkflows] = React.useState<ProjectWorkflow[]>([])
    const [selectedWorkflowId, setSelectedWorkflowId] = React.useState<string | null>(null)
    const [isLoading, setIsLoading] = React.useState(true)
    const [isPending, startTransition] = React.useTransition()
    
    // Dialog states
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    
    // Workflow Dialog states
    const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = React.useState(false)
    const [isWorkflowDeleteDialogOpen, setIsWorkflowDeleteDialogOpen] = React.useState(false)
    const [currentWorkflow, setCurrentWorkflow] = React.useState<{ id?: string; name: string } | null>(null)

    const [currentItem, setCurrentItem] = React.useState<{ id?: string; phase_name: string; duration_days: number; state: "Active" | "Complete" | "Archived" } | null>(null)
    const [itemToDelete, setItemToDelete] = React.useState<{ id: string; name: string } | null>(null)

    const loadWorkflowsAndPhases = React.useCallback(async () => {
        setIsLoading(true)
        const wfResult = await getProjectWorkflows(projectId)
        if (wfResult.success && wfResult.workflows) {
            setWorkflows(wfResult.workflows)
            
            // Set initial selected workflow if not set
            let activeWfId = selectedWorkflowId
            if (!activeWfId && wfResult.workflows.length > 0) {
                activeWfId = wfResult.workflows[0].id
                setSelectedWorkflowId(activeWfId)
            }

            if (activeWfId) {
                const pResult = await getProjectPhases(projectId, activeWfId)
                if (pResult.success && pResult.phases) {
                    setPhases(pResult.phases)
                }
            } else {
                setPhases([])
            }
        }
        setIsLoading(false)
    }, [projectId, selectedWorkflowId])

    React.useEffect(() => {
        loadWorkflowsAndPhases()
    }, [loadWorkflowsAndPhases])

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
        if (!currentItem || !selectedWorkflowId) return

        startTransition(async () => {
            const result = currentItem.id
                ? await updatePhase(projectId, currentItem.id, { 
                    phase_name: currentItem.phase_name, 
                    duration_days: currentItem.duration_days,
                    state: currentItem.state
                  })
                : await addPhase(projectId, selectedWorkflowId, currentItem.phase_name, currentItem.duration_days, currentItem.state)

            if (result.success) {
                toast.success(`Successfully ${currentItem.id ? "updated" : "added"} phase`)
                setIsDialogOpen(false)
                setCurrentItem(null)
                loadWorkflowsAndPhases() // Refresh list
            } else {
                toast.error(result.error || "An error occurred")
            }
        })
    }

    const onSaveWorkflow = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!currentWorkflow) return

        startTransition(async () => {
            const result = currentWorkflow.id
                ? await updateWorkflow(projectId, currentWorkflow.id, currentWorkflow.name)
                : await createWorkflow(projectId, currentWorkflow.name)

            if (result.success) {
                toast.success(`Successfully ${currentWorkflow.id ? "updated" : "created"} workflow`)
                setIsWorkflowDialogOpen(false)
                if (!currentWorkflow.id && (result as any).workflow?.id) {
                    setSelectedWorkflowId((result as any).workflow.id)
                }
                setCurrentWorkflow(null)
                loadWorkflowsAndPhases()
            } else {
                toast.error(result.error || "An error occurred")
            }
        })
    }

    const onConfirmDeleteWorkflow = async () => {
        if (!selectedWorkflowId) return

        startTransition(async () => {
            const result = await deleteWorkflow(projectId, selectedWorkflowId)
            if (result.success) {
                toast.success("Successfully deleted workflow")
                setIsWorkflowDeleteDialogOpen(false)
                setSelectedWorkflowId(null)
                loadWorkflowsAndPhases()
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
                loadWorkflowsAndPhases() // Refresh list
            } else {
                toast.error(result.error || "An error occurred")
            }
        })
    }

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading review phases...</div>
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <div>
                        <CardTitle>Review Workflows</CardTitle>
                        <CardDescription>
                            Create multiple workflow templates for different types of reviews.
                        </CardDescription>
                    </div>
                    <Button onClick={() => { setCurrentWorkflow({ name: "" }); setIsWorkflowDialogOpen(true) }} size="sm" variant="outline">
                        <Plus className="mr-2 h-4 w-4" />
                        New Workflow
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Select 
                                value={selectedWorkflowId || ""} 
                                onValueChange={setSelectedWorkflowId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a workflow" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workflows.map(wf => (
                                        <SelectItem key={wf.id} value={wf.id}>
                                            {wf.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedWorkflowId && (
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                        const wf = workflows.find(w => w.id === selectedWorkflowId)
                                        if (wf) {
                                            setCurrentWorkflow({ id: wf.id, name: wf.name })
                                            setIsWorkflowDialogOpen(true)
                                        }
                                    }}
                                >
                                    Rename
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-destructive"
                                    onClick={() => setIsWorkflowDeleteDialogOpen(true)}
                                >
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {selectedWorkflowId ? (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Workflow Phases</CardTitle>
                            <CardDescription>
                                Define the sequence of phases for the selected workflow.
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
            ) : (
                <div className="p-12 border border-dashed rounded-lg text-center text-muted-foreground">
                    Create or select a workflow to manage its phases.
                </div>
            )}

            {/* Workflow Add/Edit Dialog */}
            <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
                <DialogContent>
                    <form onSubmit={onSaveWorkflow}>
                        <DialogHeader>
                            <DialogTitle>{currentWorkflow?.id ? "Rename" : "Create"} Workflow</DialogTitle>
                            <DialogDescription>
                                Give your workflow a descriptive name.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="workflow-name">Workflow Name</Label>
                                <Input
                                    id="workflow-name"
                                    value={currentWorkflow?.name || ""}
                                    onChange={(e) => setCurrentWorkflow(prev => ({ ...prev!, name: e.target.value }))}
                                    placeholder="e.g. standard design review"
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsWorkflowDialogOpen(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Workflow Delete Confirmation */}
            <Dialog open={isWorkflowDeleteDialogOpen} onOpenChange={setIsWorkflowDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Workflow</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this workflow? All associated phases will also be removed.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsWorkflowDeleteDialogOpen(false)} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={onConfirmDeleteWorkflow} disabled={isPending}>
                            {isPending ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
