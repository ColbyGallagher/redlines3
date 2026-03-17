"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, Trash2, GripVertical, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getProjectPhases, saveProjectPhases } from "@/lib/actions/workflow"
import type { ProjectReviewPhase } from "@/lib/db/types"

interface WorkflowSettingsProps {
    projectId: string
}

export function WorkflowSettings({ projectId }: WorkflowSettingsProps) {
    const [phases, setPhases] = React.useState<Omit<ProjectReviewPhase, "id" | "project_id" | "created_at" | "updated_at">[]>([])
    const [isLoading, setIsLoading] = React.useState(true)
    const [isSaving, setIsSaving] = React.useState(false)

    React.useEffect(() => {
        async function loadPhases() {
            const result = await getProjectPhases(projectId)
            if (result.success && result.phases) {
                setPhases(result.phases.map(p => ({
                    phase_name: p.phase_name,
                    duration_days: p.duration_days,
                    order_index: p.order_index
                })))
            }
            setIsLoading(false)
        }
        loadPhases()
    }, [projectId])

    const handleAddPhase = () => {
        setPhases([...phases, { 
            phase_name: "New Phase", 
            duration_days: 5, 
            order_index: phases.length 
        }])
    }

    const handleRemovePhase = (index: number) => {
        const newPhases = phases.filter((_, i) => i !== index)
        setPhases(newPhases.map((p, i) => ({ ...p, order_index: i })))
    }

    const handleUpdatePhase = (index: number, updates: Partial<Omit<ProjectReviewPhase, "id" | "project_id" | "created_at" | "updated_at">>) => {
        const newPhases = [...phases]
        newPhases[index] = { ...newPhases[index], ...updates }
        setPhases(newPhases)
    }

    const handleSave = async () => {
        setIsSaving(true)
        const result = await saveProjectPhases(projectId, phases)
        if (result.success) {
            toast.success("Workflow phases saved successfully")
        } else {
            toast.error(result.error || "Failed to save workflow phases")
        }
        setIsSaving(false)
    }

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground">Loading workflow phases...</div>
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Project Review Phases</CardTitle>
                    <CardDescription>
                        Define the phases and durations for reviews in this project.
                    </CardDescription>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleAddPhase}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Phase
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {phases.length === 0 ? (
                        <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
                            No phases defined. Add a phase to get started.
                        </div>
                    ) : (
                        phases.map((phase, index) => (
                            <div key={index} className="flex items-end gap-4 border p-4 rounded-lg bg-card shadow-sm">
                                <div className="flex-1 space-y-2">
                                    <Label>Phase Name</Label>
                                    <Input 
                                        value={phase.phase_name} 
                                        onChange={(e) => handleUpdatePhase(index, { phase_name: e.target.value })}
                                        placeholder="e.g. SME Review"
                                    />
                                </div>
                                <div className="w-32 space-y-2">
                                    <Label>Duration (Days)</Label>
                                    <Input 
                                        type="number" 
                                        value={phase.duration_days} 
                                        onChange={(e) => handleUpdatePhase(index, { duration_days: parseInt(e.target.value) || 0 })}
                                        min={1}
                                    />
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-destructive"
                                    onClick={() => handleRemovePhase(index)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
