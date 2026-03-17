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

import { ExtractionSetup, ExtractionSettings } from "@/lib/db/types"
import { ExtractionCalibrationDialog } from "@/components/reviews/extraction-calibration-dialog"
import { Trash2, Edit2, Plus, FileUp } from "lucide-react"


type ProjectSettings = {
    statuses: any[]
    importances: any[]
    disciplines: any[]
    states: any[]
    suitabilities: any[]
    packages: any[]
    classifications: any[]
    defaultReviewTimes: { stage: string; days: number }[]
    defaultResponsePeriods: { role: string; days: number }[]
    extraction_settings?: ExtractionSettings | null
    extraction_setups?: ExtractionSetup[] | null
}

type ProjectSettingsResponse = {
    settings: ProjectSettings
}

type SettingsFormState = {
    statuses: any[]
    importances: any[]
    disciplines: any[]
    states: any[]
    suitabilities: any[]
    packages: any[]
    classifications: any[]
    defaultReviewTimes: { stage: string; days: number }[]
    defaultResponsePeriods: { role: string; days: number }[]
    extraction_settings?: ExtractionSettings | null
    extraction_setups: ExtractionSetup[]
}

function createInitialFormState(settings: ProjectSettings): SettingsFormState {
    return {
        statuses: [...settings.statuses],
        importances: [...settings.importances],
        disciplines: [...settings.disciplines],
        states: [...settings.states],
        suitabilities: [...settings.suitabilities],
        packages: [...settings.packages],
        classifications: [...settings.classifications],
        defaultReviewTimes: settings.defaultReviewTimes.map((entry) => ({ ...entry })),
        defaultResponsePeriods: settings.defaultResponsePeriods.map((entry) => ({ ...entry })),
        extraction_setups: settings.extraction_setups ? [...settings.extraction_setups] : [],
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
    
    // Extraction setups management
    const [isCalibrationOpen, setIsCalibrationOpen] = React.useState(false)
    const [setupToEdit, setSetupToEdit] = React.useState<{ index: number; setup: ExtractionSetup } | null>(null)
    const [isSamplePdfDialogOpen, setIsSamplePdfDialogOpen] = React.useState(false)
    const [samplePdfUrl, setSamplePdfUrl] = React.useState<string | null>(null)
    const [isDeletingSetup, setIsDeletingSetup] = React.useState<number | null>(null)

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

        const isExtractionSetupsEqual = () => {
            if (formState.extraction_setups.length !== (settings.extraction_setups?.length || 0)) return false
            return formState.extraction_setups.every((s, i) => {
                const other = settings.extraction_setups![i]
                return s.id === other.id && s.name === other.name && JSON.stringify(s.settings) === JSON.stringify(other.settings)
            })
        }

        return (
            !compareArrays(formState.statuses, settings.statuses) ||
            !compareArrays(formState.importances, settings.importances) ||
            !compareArrays(formState.disciplines, settings.disciplines) ||
            !compareArrays(formState.states, settings.states) ||
            !compareArrays(formState.suitabilities, settings.suitabilities) ||
            !isReviewTimesEqual() ||
            !isResponsePeriodsEqual() ||
            !isExtractionSetupsEqual()
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


    const handleAddSetup = React.useCallback(() => {
        setSetupToEdit(null)
        setIsSamplePdfDialogOpen(true)
    }, [])

    const handleEditSetup = React.useCallback((index: number, setup: ExtractionSetup) => {
        // For editing, we need a PDF URL. In a real app, we might store the sample PDF URL used during calibration,
        // or just ask for a new sample. For now, let's ask for a sample even for editing to keep it simple,
        // OR if the project already has documents, we could use the first document.
        // Let's stick to asking for a sample PDF for simplicity of the workflow.
        setSetupToEdit({ index, setup: { ...setup } })
        setIsSamplePdfDialogOpen(true)
    }, [])

    const handleRemoveSetup = React.useCallback((index: number) => {
        setFormState(prev => {
            if (!prev) return prev
            const nextSetups = [...prev.extraction_setups]
            nextSetups.splice(index, 1)
            return { ...prev, extraction_setups: nextSetups }
        })
    }, [])

    const handleCalibrationSave = React.useCallback((setupData: { name: string; settings: ExtractionSettings }) => {
        setFormState(prev => {
            if (!prev) return prev
            const nextSetups = [...prev.extraction_setups]
            
            if (setupToEdit && setupToEdit.index !== -1) {
                // Update existing
                nextSetups[setupToEdit.index] = {
                    ...nextSetups[setupToEdit.index],
                    name: setupData.name,
                    settings: setupData.settings
                }
            } else {
                // Add new
                nextSetups.push({
                    id: Math.random().toString(36).substring(2, 9),
                    name: setupData.name,
                    settings: setupData.settings
                })
            }
            
            return { ...prev, extraction_setups: nextSetups }
        })
        setIsCalibrationOpen(false)
        setSamplePdfUrl(null)
        setSetupToEdit(null)
    }, [setupToEdit])

    const handleSamplePdfChange = React.useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (!file) return

        // In a real app, you'd upload this to storage and get a public URL.
        // For the purpose of calibration in the UI, we can use a local object URL.
        const url = URL.createObjectURL(file)
        setSamplePdfUrl(url)
        setIsSamplePdfDialogOpen(false)
        setIsCalibrationOpen(true)
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
                        statuses: formState.statuses,
                        importances: formState.importances,
                        disciplines: formState.disciplines,
                        states: formState.states,
                        suitabilities: formState.suitabilities,
                        extraction_setups: formState.extraction_setups,
                    },
                }),
            })

            if (response.ok) {
                toast.success("Project settings saved successfully")
                const updatedSettings: ProjectSettings = {
                    statuses: [...formState.statuses],
                    importances: [...formState.importances],
                    disciplines: [...formState.disciplines],
                    states: [...formState.states],
                    suitabilities: [...formState.suitabilities],
                    defaultReviewTimes: settings?.defaultReviewTimes || [],
                    defaultResponsePeriods: settings?.defaultResponsePeriods || [],
                    extraction_settings: settings?.extraction_settings ? { ...settings.extraction_settings } : {},
                    extraction_setups: [...formState.extraction_setups],
                    packages: [...formState.packages],
                    classifications: [...formState.classifications],
                }
                setSettings(updatedSettings)
                return true
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
                                        <h2 className="text-lg font-semibold">PDF Extraction Management</h2>
                                        <p className="text-muted-foreground text-sm">
                                            Manage coordinate-based extraction setups for different document types.
                                        </p>
                                    </div>
                                    <Button type="button" variant="outline" size="sm" onClick={handleAddSetup}>
                                        <Plus className="size-4 mr-2" />
                                        Add Setup
                                    </Button>
                                </header>
                                <div className="grid gap-3">
                                    {formState.extraction_setups.length ? (
                                        formState.extraction_setups.map((setup, index) => (
                                            <div
                                                key={setup.id}
                                                className="border-border hover:border-primary/50 flex items-center justify-between gap-3 rounded-lg border bg-card p-4 transition"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                                        <FileUp className="size-4 text-primary" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-medium text-sm">{setup.name}</h3>
                                                        <p className="text-muted-foreground text-xs">
                                                            Fields: {setup.settings ? Object.keys(setup.settings).length : 0} calibrated
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSetup(index, setup)}>
                                                        <Edit2 className="size-4" />
                                                    </Button>
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleRemoveSetup(index)}>
                                                        <Trash2 className="size-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="border border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center space-y-2">
                                            <p className="text-muted-foreground text-sm">No extraction setups defined.</p>
                                            <Button type="button" variant="link" onClick={handleAddSetup}>Create your first setup</Button>
                                        </div>
                                    )}
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
            <SamplePdfDialog
                open={isSamplePdfDialogOpen}
                onOpenChange={setIsSamplePdfDialogOpen}
                onFileChange={handleSamplePdfChange}
            />
            {samplePdfUrl && (
                <ExtractionCalibrationDialog
                    open={isCalibrationOpen}
                    onOpenChange={setIsCalibrationOpen}
                    pdfUrl={samplePdfUrl}
                    projectId={projectId}
                    onSave={handleCalibrationSave}
                    initialSettings={setupToEdit?.setup.settings}
                    initialName={setupToEdit?.setup.name}
                />
            )}
        </div >
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
function SamplePdfDialog({ open, onOpenChange, onFileChange }: { open: boolean; onOpenChange: (open: boolean) => void; onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Upload Sample PDF</DialogTitle>
                    <DialogDescription>
                        To calibrate extraction, please upload a sample PDF that matches the layout you want to extract from.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex items-center justify-center p-8 border-2 border-dashed rounded-lg">
                    <label className="flex flex-col items-center gap-2 cursor-pointer group">
                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <FileUp className="size-6 text-primary" />
                        </div>
                        <span className="text-sm font-medium">Click to select PDF</span>
                        <input type="file" accept="application/pdf" className="hidden" onChange={onFileChange} />
                    </label>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
