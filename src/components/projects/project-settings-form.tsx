"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

type Milestone = {
    name: string
    description?: string
}

type ProjectSettings = {
    availableMilestones: Milestone[]
    selectedMilestones: string[]
    titleblockTemplateUrl?: string
    documentNamingConvention: string
    documentCodeLocation: string
    statuses: string[]
    importances: string[]
    disciplines: string[]
    states: string[]
    suitabilities: string[]
    defaultReviewTimes: { stage: string; days: number }[]
    defaultResponsePeriods: { role: string; days: number }[]
}

type ProjectSettingsResponse = {
    settings: ProjectSettings
}

type SettingsFormState = {
    availableMilestones: Milestone[]
    selectedMilestones: Set<string>
    documentNamingConvention: string
    documentCodeLocation: string
    statuses: string[]
    importances: string[]
    disciplines: string[]
    states: string[]
    suitabilities: string[]
    defaultReviewTimes: { stage: string; days: number }[]
    defaultResponsePeriods: { role: string; days: number }[]
    titleblockTemplateUrl?: string
    titleblockFile?: File | null
}

function createInitialFormState(settings: ProjectSettings): SettingsFormState {
    return {
        availableMilestones: settings.availableMilestones.map(m => ({ ...m })),
        selectedMilestones: new Set(settings.selectedMilestones),
        documentNamingConvention: settings.documentNamingConvention,
        documentCodeLocation: settings.documentCodeLocation,
        statuses: [...settings.statuses],
        importances: [...settings.importances],
        disciplines: [...settings.disciplines],
        states: [...settings.states],
        suitabilities: [...settings.suitabilities],
        defaultReviewTimes: settings.defaultReviewTimes.map((entry) => ({ ...entry })),
        defaultResponsePeriods: settings.defaultResponsePeriods.map((entry) => ({ ...entry })),
        titleblockTemplateUrl: settings.titleblockTemplateUrl,
        titleblockFile: null,
    }
}

interface ProjectSettingsFormProps {
    projectId: string
}

export function ProjectSettingsForm({ projectId }: ProjectSettingsFormProps) {
    const router = useRouter()
    const [settings, setSettings] = React.useState<ProjectSettings | null>(null)
    const [formState, setFormState] = React.useState<SettingsFormState | null>(null)
    const [isSaving, setIsSaving] = React.useState(false)
    const [milestoneToEdit, setMilestoneToEdit] = React.useState<{ index: number; milestone: Milestone } | null>(null)
    const [isMilestoneDialogOpen, setIsMilestoneDialogOpen] = React.useState(false)
    const [isSavingMilestone, setIsSavingMilestone] = React.useState(false)
    const [milestoneToDelete, setMilestoneToDelete] = React.useState<number | null>(null)
    const [isMilestoneDeleteDialogOpen, setIsMilestoneDeleteDialogOpen] = React.useState(false)
    const [isUnsavedChangesDialogOpen, setIsUnsavedChangesDialogOpen] = React.useState(false)
    const [onConfirmDiscard, setOnConfirmDiscard] = React.useState<(() => void) | null>(null)

    React.useEffect(() => {
        async function loadSettings() {
            try {
                const response = await fetch(`/api/projects/${projectId}/settings`, {
                    credentials: "include",
                    headers: {
                        Accept: "application/json",
                    },
                })

                if (!response.ok) {
                    const payload = await response
                        .json()
                        .catch(() => ({ error: `Request failed with status ${response.status}` }))
                    throw new Error(typeof payload.error === "string" ? payload.error : `Request failed with status ${response.status}`)
                }

                const data: ProjectSettingsResponse = await response.json()
                setSettings(data.settings)
                setFormState(createInitialFormState(data.settings))
            } catch (error) {
                console.error("Failed to load project settings", error)
                setSettings(null)
                setFormState(null)
            }
        }

        void loadSettings()
    }, [projectId])

    const isDirty = React.useMemo(() => {
        if (!settings || !formState) return false

        const compareArrays = (a: string[], b: string[]) => {
            if (a.length !== b.length) return false
            return a.every((val, idx) => val === b[idx])
        }

        const isMilestonesEqual = () => {
            if (formState.availableMilestones.length !== settings.availableMilestones.length) return false
            return formState.availableMilestones.every((m, i) =>
                m.name === settings.availableMilestones[i].name &&
                m.description === settings.availableMilestones[i].description
            )
        }

        const isSelectedMilestonesEqual = () => {
            if (formState.selectedMilestones.size !== settings.selectedMilestones.length) return false
            return settings.selectedMilestones.every(m => formState.selectedMilestones.has(m))
        }

        const isReviewTimesEqual = () => {
            if (formState.defaultReviewTimes.length !== settings.defaultReviewTimes.length) return false
            return formState.defaultReviewTimes.every((t, i) =>
                t.stage === settings.defaultReviewTimes[i].stage &&
                t.days === settings.defaultReviewTimes[i].days
            )
        }

        const isResponsePeriodsEqual = () => {
            if (formState.defaultResponsePeriods.length !== settings.defaultResponsePeriods.length) return false
            return formState.defaultResponsePeriods.every((p, i) =>
                p.role === settings.defaultResponsePeriods[i].role &&
                p.days === settings.defaultResponsePeriods[i].days
            )
        }

        return (
            formState.documentNamingConvention !== settings.documentNamingConvention ||
            formState.documentCodeLocation !== settings.documentCodeLocation ||
            formState.titleblockTemplateUrl !== settings.titleblockTemplateUrl ||
            formState.titleblockFile !== null ||
            !isMilestonesEqual() ||
            !isSelectedMilestonesEqual() ||
            !compareArrays(formState.statuses, settings.statuses) ||
            !compareArrays(formState.importances, settings.importances) ||
            !compareArrays(formState.disciplines, settings.disciplines) ||
            !compareArrays(formState.states, settings.states) ||
            !compareArrays(formState.suitabilities, settings.suitabilities) ||
            !isReviewTimesEqual() ||
            !isResponsePeriodsEqual()
        )
    }, [settings, formState])

    React.useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty) {
                e.preventDefault()
                e.returnValue = ""
            }
        }

        const handlePopState = (e: PopStateEvent) => {
            if (isDirty) {
                // Stay on page by pushing the current URL back onto the stack
                window.history.pushState(null, "", window.location.href)

                setOnConfirmDiscard(() => () => {
                    // We need to actually go back now. 
                    window.history.back()
                })
                setIsUnsavedChangesDialogOpen(true)
            }
        }

        window.addEventListener("beforeunload", handleBeforeUnload)
        window.addEventListener("popstate", handlePopState)

        return () => {
            window.removeEventListener("beforeunload", handleBeforeUnload)
            window.removeEventListener("popstate", handlePopState)
        }
    }, [isDirty])

    const toggleMilestone = React.useCallback((milestone: string, checked: boolean) => {
        setFormState((prev) => {
            if (!prev) return prev
            const nextSelected = new Set(prev.selectedMilestones)
            if (checked) {
                nextSelected.add(milestone)
            } else {
                nextSelected.delete(milestone)
            }

            return {
                ...prev,
                selectedMilestones: nextSelected,
            }
        })
    }, [])

    const handleAddMilestone = React.useCallback(() => {
        setMilestoneToEdit({ index: -1, milestone: { name: "", description: "" } })
        setIsMilestoneDialogOpen(true)
    }, [])

    const handleEditMilestone = React.useCallback((index: number, milestone: Milestone) => {
        setMilestoneToEdit({ index, milestone: { ...milestone } })
        setIsMilestoneDialogOpen(true)
    }, [])

    const handleDeleteMilestone = React.useCallback((index: number) => {
        setMilestoneToDelete(index)
        setIsMilestoneDeleteDialogOpen(true)
    }, [])

    const confirmDeleteMilestone = React.useCallback(async () => {
        if (milestoneToDelete === null || !formState) return

        setIsSavingMilestone(true)
        try {
            const nextAvailable = [...formState.availableMilestones]
            const removed = nextAvailable.splice(milestoneToDelete, 1)[0]

            const nextSelected = new Set(formState.selectedMilestones)
            nextSelected.delete(removed.name)

            const response = await fetch(`/api/projects/${projectId}/settings/milestones`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    availableMilestones: nextAvailable,
                    selectedMilestones: Array.from(nextSelected),
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errorData.error || "Failed to delete milestone")
            }

            setFormState((prev) => {
                if (!prev) return prev
                return {
                    ...prev,
                    availableMilestones: nextAvailable,
                    selectedMilestones: nextSelected,
                }
            })
            setSettings((prev) => {
                if (!prev) return prev
                return {
                    ...prev,
                    availableMilestones: nextAvailable,
                    selectedMilestones: Array.from(nextSelected),
                }
            })

            toast.success("Milestone deleted successfully")
            setIsMilestoneDeleteDialogOpen(false)
            setMilestoneToDelete(null)
        } catch (error) {
            console.error("Error deleting milestone:", error)
            toast.error(error instanceof Error ? error.message : "Failed to delete milestone")
        } finally {
            setIsSavingMilestone(false)
        }
    }, [formState, milestoneToDelete, projectId])

    const handleSaveMilestone = React.useCallback(async (milestone: Milestone) => {
        if (!milestone.name.trim()) return

        setIsSavingMilestone(true)
        try {
            const nextAvailable = formState ? [...formState.availableMilestones] : []
            const nextSelected = formState ? new Set(formState.selectedMilestones) : new Set<string>()

            if (milestoneToEdit && milestoneToEdit.index !== -1) {
                // Edit existing
                const oldName = nextAvailable[milestoneToEdit.index].name
                nextAvailable[milestoneToEdit.index] = milestone

                if (nextSelected.has(oldName)) {
                    nextSelected.delete(oldName)
                    nextSelected.add(milestone.name)
                }
            } else {
                // Add new
                nextAvailable.push(milestone)
                nextSelected.add(milestone.name)
            }

            const response = await fetch(`/api/projects/${projectId}/settings/milestones`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    availableMilestones: nextAvailable,
                    selectedMilestones: Array.from(nextSelected),
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                throw new Error(errorData.error || "Failed to save milestone")
            }

            setFormState((prev) => {
                if (!prev) return prev
                return {
                    ...prev,
                    availableMilestones: nextAvailable,
                    selectedMilestones: nextSelected,
                }
            })
            setSettings((prev) => {
                if (!prev) return prev
                return {
                    ...prev,
                    availableMilestones: nextAvailable,
                    selectedMilestones: Array.from(nextSelected),
                }
            })

            toast.success("Milestone saved successfully")
            setIsMilestoneDialogOpen(false)
        } catch (error) {
            console.error("Error saving milestone:", error)
            toast.error(error instanceof Error ? error.message : "Failed to save milestone")
        } finally {
            setIsSavingMilestone(false)
        }
    }, [formState, milestoneToEdit, projectId])

    const handleTitleblockChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        setFormState((prev) => (prev ? { ...prev, titleblockFile: file ?? null } : prev))
    }, [])

    const handleNamingConventionChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { value } = event.target
        setFormState((prev) => (prev ? { ...prev, documentNamingConvention: value } : prev))
    }, [])

    const handleDocumentCodeLocationChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = event.target
        setFormState((prev) => (prev ? { ...prev, documentCodeLocation: value } : prev))
    }, [])

    const handleDefaultReviewTimeChange = React.useCallback(
        (index: number, field: "stage" | "days", value: string) => {
            setFormState((prev) => {
                if (!prev) return prev

                const nextEntries = prev.defaultReviewTimes.map((entry, entryIndex) => {
                    if (entryIndex !== index) return entry
                    if (field === "days") {
                        const days = Number.parseInt(value, 10)
                        return {
                            ...entry,
                            days: Number.isFinite(days) ? Math.max(days, 0) : entry.days,
                        }
                    }

                    return {
                        ...entry,
                        stage: value,
                    }
                })

                return {
                    ...prev,
                    defaultReviewTimes: nextEntries,
                }
            })
        },
        []
    )

    const handleDefaultResponsePeriodChange = React.useCallback(
        (index: number, field: "role" | "days", value: string) => {
            setFormState((prev) => {
                if (!prev) return prev

                const nextEntries = prev.defaultResponsePeriods.map((entry, entryIndex) => {
                    if (entryIndex !== index) return entry
                    if (field === "days") {
                        const days = Number.parseInt(value, 10)
                        return {
                            ...entry,
                            days: Number.isFinite(days) ? Math.max(days, 0) : entry.days,
                        }
                    }

                    return {
                        ...entry,
                        role: value,
                    }
                })

                return {
                    ...prev,
                    defaultResponsePeriods: nextEntries,
                }
            })
        },
        []
    )

    const addDefaultReviewStage = React.useCallback(() => {
        setFormState((prev) =>
            prev
                ? {
                    ...prev,
                    defaultReviewTimes: [...prev.defaultReviewTimes, { stage: "New stage", days: 5 }],
                }
                : prev
        )
    }, [])

    const addDefaultResponsePeriod = React.useCallback(() => {
        setFormState((prev) =>
            prev
                ? {
                    ...prev,
                    defaultResponsePeriods: [...prev.defaultResponsePeriods, { role: "New role", days: 5 }],
                }
                : prev
        )
    }, [])

    const removeDefaultReviewStage = React.useCallback((index: number) => {
        setFormState((prev) =>
            prev
                ? {
                    ...prev,
                    defaultReviewTimes: prev.defaultReviewTimes.filter((_, entryIndex) => entryIndex !== index),
                }
                : prev
        )
    }, [])

    const removeDefaultResponsePeriod = React.useCallback((index: number) => {
        setFormState((prev) =>
            prev
                ? {
                    ...prev,
                    defaultResponsePeriods: prev.defaultResponsePeriods.filter((_, entryIndex) => entryIndex !== index),
                }
                : prev
        )
    }, [])

    const handleSave = React.useCallback(async () => {
        if (!formState) return false

        setIsSaving(true)
        try {
            const response = await fetch(`/api/projects/${projectId}/settings`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    settings: {
                        availableMilestones: formState.availableMilestones,
                        selectedMilestones: Array.from(formState.selectedMilestones),
                        documentNamingConvention: formState.documentNamingConvention,
                        documentCodeLocation: formState.documentCodeLocation,
                        statuses: formState.statuses,
                        importances: formState.importances,
                        disciplines: formState.disciplines,
                        states: formState.states,
                        suitabilities: formState.suitabilities,
                        defaultReviewTimes: formState.defaultReviewTimes,
                        defaultResponsePeriods: formState.defaultResponsePeriods,
                        titleblockTemplateUrl: formState.titleblockTemplateUrl,
                    },
                }),
            })

            if (response.ok) {
                toast.success("Project settings saved successfully")
                const updatedSettings: ProjectSettings = {
                    availableMilestones: formState.availableMilestones.map(m => ({ ...m })),
                    selectedMilestones: Array.from(formState.selectedMilestones),
                    documentNamingConvention: formState.documentNamingConvention,
                    documentCodeLocation: formState.documentCodeLocation,
                    statuses: [...formState.statuses],
                    importances: [...formState.importances],
                    disciplines: [...formState.disciplines],
                    states: [...formState.states],
                    suitabilities: [...formState.suitabilities],
                    defaultReviewTimes: formState.defaultReviewTimes.map(t => ({ ...t })),
                    defaultResponsePeriods: formState.defaultResponsePeriods.map(p => ({ ...p })),
                    titleblockTemplateUrl: formState.titleblockTemplateUrl,
                }
                setSettings(updatedSettings)
                return true
            } else {
                const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                console.error("Server error details:", errorData)
                throw new Error(errorData.error || "Failed to save settings")
            }
        } catch (error) {
            console.error("Error saving settings:", error)
            toast.error(error instanceof Error ? error.message : "Failed to save project settings")
            return false
        } finally {
            setIsSaving(false)
        }
    }, [formState, projectId])

    const handleSubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        void handleSave()
    }, [handleSave])

    const isLoading = !settings || !formState

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center p-8 text-muted-foreground">
                Loading settings...
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col">
            <div className="flex-1 overflow-y-auto">
                <form id="project-settings-form" className="space-y-10 p-6" onSubmit={handleSubmit}>
                    {settings && formState ? (
                        <>
                            <section className="space-y-4">
                                <header className="flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                        <h2 className="text-lg font-semibold">Milestones</h2>
                                        <p className="text-muted-foreground text-sm">
                                            Select which milestones are available when creating reviews for this project.
                                        </p>
                                    </div>
                                    <span className="text-muted-foreground text-xs uppercase">{formState.selectedMilestones.size} selected</span>
                                </header>
                                <div className="grid gap-3">
                                    {formState.availableMilestones.length ? (
                                        formState.availableMilestones.map((milestone, index) => (
                                            <div
                                                key={milestone.name}
                                                className="border-border hover:border-primary/50 flex flex-col gap-3 rounded-lg border bg-card p-4 transition"
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-start gap-3">
                                                        <Checkbox
                                                            id={`milestone-${index}`}
                                                            checked={formState.selectedMilestones.has(milestone.name)}
                                                            onCheckedChange={(checked) => toggleMilestone(milestone.name, Boolean(checked))}
                                                        />
                                                        <div className="space-y-1">
                                                            <Label htmlFor={`milestone-${index}`} className="font-medium">
                                                                {milestone.name}
                                                            </Label>
                                                            {milestone.description && (
                                                                <p className="text-muted-foreground text-xs">{milestone.description}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button type="button" variant="ghost" size="sm" onClick={() => handleEditMilestone(index, milestone)}>
                                                            Edit
                                                        </Button>
                                                        <Button type="button" variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteMilestone(index)}>
                                                            Delete
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-sm">No milestones found for this project.</p>
                                    )}
                                    <Button type="button" variant="outline" className="w-full" onClick={handleAddMilestone}>
                                        Add milestone
                                    </Button>
                                </div>
                            </section>

                            <Separator />

                            <section className="space-y-4">
                                <header className="space-y-1">
                                    <h2 className="text-lg font-semibold">Titleblock & Naming</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Upload a blank titleblock and define how drawing documents are named.
                                    </p>
                                </header>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <Label htmlFor="titleblock-upload">Drawing titleblock</Label>
                                        <Input id="titleblock-upload" type="file" accept="application/pdf,image/*" onChange={handleTitleblockChange} />
                                        {formState.titleblockTemplateUrl ? (
                                            <p className="text-muted-foreground text-xs">
                                                Current template: {formState.titleblockTemplateUrl}
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="space-y-3">
                                        <Label htmlFor="document-code-location">Document code location on PDF</Label>
                                        <Input
                                            id="document-code-location"
                                            placeholder="e.g. Bottom right corner"
                                            value={formState.documentCodeLocation}
                                            onChange={handleDocumentCodeLocationChange}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="naming-convention">Document naming convention</Label>
                                    <Textarea
                                        id="naming-convention"
                                        rows={4}
                                        placeholder="Define the tokens and separators used for document names"
                                        value={formState.documentNamingConvention}
                                        onChange={handleNamingConventionChange}
                                    />
                                    <p className="text-muted-foreground text-xs">
                                        Use placeholders like {"<project>"}, {"<discipline>"}, {"<drawingNumber>"}, {"<revision>"} to guide naming.
                                    </p>
                                </div>
                            </section>

                            <Separator />

                            <section className="space-y-4">
                                <header className="space-y-1">
                                    <h2 className="text-lg font-semibold">Classification options</h2>
                                    <p className="text-muted-foreground text-sm">Control the lists that reviewers use when classifying documents and issues.</p>
                                </header>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label>Statuses</Label>
                                        <SelectableList entries={formState.statuses} onChange={(entries) => setFormState((prev) => (prev ? { ...prev, statuses: entries } : prev))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Importance</Label>
                                        <SelectableList entries={formState.importances} onChange={(entries) => setFormState((prev) => (prev ? { ...prev, importances: entries } : prev))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Discipline</Label>
                                        <SelectableList entries={formState.disciplines} onChange={(entries) => setFormState((prev) => (prev ? { ...prev, disciplines: entries } : prev))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>State</Label>
                                        <SelectableList entries={formState.states} onChange={(entries) => setFormState((prev) => (prev ? { ...prev, states: entries } : prev))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Suitability</Label>
                                        <SelectableList entries={formState.suitabilities} onChange={(entries) => setFormState((prev) => (prev ? { ...prev, suitabilities: entries } : prev))} />
                                    </div>
                                </div>
                            </section>

                            <Separator />

                            <section className="space-y-4">
                                <header className="space-y-1">
                                    <h2 className="text-lg font-semibold">Review timelines</h2>
                                    <p className="text-muted-foreground text-sm">Set expectations for review durations and responses in working days.</p>
                                </header>
                                <div className="grid gap-8 md:grid-cols-2">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Default review times</h3>
                                            <Button type="button" size="sm" variant="outline" onClick={addDefaultReviewStage}>
                                                Add stage
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {formState.defaultReviewTimes.map((entry, index) => (
                                                <TimelineEntry
                                                    key={`${entry.stage}-${index}`}
                                                    label="Stage"
                                                    name={entry.stage}
                                                    days={entry.days}
                                                    onNameChange={(value) => handleDefaultReviewTimeChange(index, "stage", value)}
                                                    onDaysChange={(value) => handleDefaultReviewTimeChange(index, "days", value)}
                                                    onRemove={() => removeDefaultReviewStage(index)}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Default response periods</h3>
                                            <Button type="button" size="sm" variant="outline" onClick={addDefaultResponsePeriod}>
                                                Add role
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {formState.defaultResponsePeriods.map((entry, index) => (
                                                <TimelineEntry
                                                    key={`${entry.role}-${index}`}
                                                    label="Role"
                                                    name={entry.role}
                                                    days={entry.days}
                                                    onNameChange={(value) => handleDefaultResponsePeriodChange(index, "role", value)}
                                                    onDaysChange={(value) => handleDefaultResponsePeriodChange(index, "days", value)}
                                                    onRemove={() => removeDefaultResponsePeriod(index)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </>
                    ) : null}
                </form>
            </div>

            <div className="border-t bg-muted/40 p-6">
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-muted-foreground text-xs">
                        Changes apply to future reviews; existing reviews keep their current configuration.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                if (isDirty) {
                                    setOnConfirmDiscard(() => () => router.push(`/projects/${projectId}`))
                                    setIsUnsavedChangesDialogOpen(true)
                                } else {
                                    router.push(`/projects/${projectId}`)
                                }
                            }}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" form="project-settings-form" disabled={isLoading || !formState || isSaving}>
                            {isSaving ? "Saving..." : "Save settings"}
                        </Button>
                    </div>
                </div>
            </div>
            <MilestoneDialog
                open={isMilestoneDialogOpen}
                onOpenChange={setIsMilestoneDialogOpen}
                milestone={milestoneToEdit?.milestone}
                onSave={handleSaveMilestone}
                isSaving={isSavingMilestone}
            />
            <MilestoneDeleteDialog
                open={isMilestoneDeleteDialogOpen}
                onOpenChange={setIsMilestoneDeleteDialogOpen}
                onDelete={confirmDeleteMilestone}
                isSaving={isSavingMilestone}
            />
            <UnsavedChangesDialog
                open={isUnsavedChangesDialogOpen}
                onOpenChange={setIsUnsavedChangesDialogOpen}
                onDiscard={() => {
                    setIsUnsavedChangesDialogOpen(false)
                    if (onConfirmDiscard) onConfirmDiscard()
                }}
                onSave={async () => {
                    const success = await handleSave()
                    if (success) {
                        setIsUnsavedChangesDialogOpen(false)
                        if (onConfirmDiscard) onConfirmDiscard()
                    }
                }}
            />
        </div >
    )
}

type SelectableListProps = {
    entries: string[]
    onChange: (nextEntries: string[]) => void
}

function SelectableList({ entries, onChange }: SelectableListProps) {
    const [value, setValue] = React.useState<string>("")

    const addEntry = React.useCallback(() => {
        const next = value.trim()
        if (!next || entries.includes(next)) return
        onChange([...entries, next])
        setValue("")
    }, [entries, onChange, value])

    const handleKeyDown = React.useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                event.preventDefault()
                addEntry()
            }
        },
        [addEntry]
    )

    const removeEntry = React.useCallback(
        (entry: string) => {
            onChange(entries.filter((item) => item !== entry))
        },
        [entries, onChange]
    )

    return (
        <div className="space-y-3">
            <div className="flex gap-2">
                <Input
                    placeholder="Add entry"
                    value={value}
                    onChange={(event) => setValue(event.target.value)}
                    onKeyDown={handleKeyDown}
                />
                <Button type="button" variant="secondary" onClick={addEntry}>
                    Add
                </Button>
            </div>
            <div className="bg-muted/30 divide-y overflow-hidden rounded-lg border">
                {entries.length ? (
                    entries.map((entry) => (
                        <div key={entry} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                            <span>{entry}</span>
                            <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(entry)}>
                                Remove
                            </Button>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground px-3 py-2 text-xs">No entries defined.</p>
                )}
            </div>
        </div>
    )
}

type TimelineEntryProps = {
    label: string
    name: string
    days: number
    onNameChange: (value: string) => void
    onDaysChange: (value: string) => void
    onRemove: () => void
}

function TimelineEntry({ label, name, days, onNameChange, onDaysChange, onRemove }: TimelineEntryProps) {
    return (
        <div className="border-border flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
                <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
                    Remove
                </Button>
            </div>
            <Input value={name} onChange={(event) => onNameChange(event.target.value)} />
            <div className="flex items-center gap-2">
                <Label htmlFor={`${label}-days`} className="whitespace-nowrap text-xs uppercase tracking-wide text-muted-foreground">
                    Working days
                </Label>
                <Input
                    id={`${label}-days`}
                    type="number"
                    min={0}
                    value={days}
                    onChange={(event) => onDaysChange(event.target.value)}
                />
            </div>
        </div>
    )
}

type MilestoneDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    milestone?: Milestone
    onSave: (milestone: Milestone) => void
    isSaving?: boolean
}

function MilestoneDialog({ open, onOpenChange, milestone, onSave, isSaving }: MilestoneDialogProps) {
    const [name, setName] = React.useState("")
    const [description, setDescription] = React.useState("")

    React.useEffect(() => {
        if (open && milestone) {
            setName(milestone.name)
            setDescription(milestone.description ?? "")
        } else if (open) {
            setName("")
            setDescription("")
        }
    }, [open, milestone])

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault()
        onSave({ name, description })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{milestone?.name ? "Edit Milestone" : "Add Milestone"}</DialogTitle>
                    <DialogDescription>
                        Define the milestone name and an optional description.
                    </DialogDescription>
                </DialogHeader>
                <form id="milestone-form" onSubmit={handleSave} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="milestone-name">Name</Label>
                        <Input
                            id="milestone-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Concept Design"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="milestone-description">Description (optional)</Label>
                        <Textarea
                            id="milestone-description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe what this milestone covers"
                            rows={3}
                        />
                    </div>
                </form>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button type="submit" form="milestone-form" disabled={isSaving || !name.trim()}>
                        {isSaving ? "Saving..." : "Save milestone"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

type MilestoneDeleteDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onDelete: () => void
    isSaving?: boolean
}

function MilestoneDeleteDialog({ open, onOpenChange, onDelete, isSaving }: MilestoneDeleteDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Milestone</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete this milestone? This action cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button type="button" variant="destructive" onClick={onDelete} disabled={isSaving}>
                        {isSaving ? "Deleting..." : "Delete milestone"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

type UnsavedChangesDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onDiscard: () => void
    onSave: () => void
}

function UnsavedChangesDialog({ open, onOpenChange, onDiscard, onSave }: UnsavedChangesDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Unsaved Changes</DialogTitle>
                    <DialogDescription>
                        You have changes that haven&apos;t been saved. Would you like to save them before leaving?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
                    <Button type="button" variant="ghost" onClick={onDiscard}>
                        Don&apos;t save changes
                    </Button>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Keep editing
                    </Button>
                    <Button type="button" onClick={onSave}>
                        Save changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
