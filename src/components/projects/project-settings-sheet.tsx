"use client"

import * as React from "react"
import type { ReactNode } from "react"
import { Settings2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

type ProjectSettingsSheetProps = {
  projectId: string
  trigger?: ReactNode
}

type ProjectSettings = {
  availableMilestones: string[]
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

export function ProjectSettingsSheet({ projectId, trigger }: ProjectSettingsSheetProps) {
  const [open, setOpen] = React.useState(false)
  const [settings, setSettings] = React.useState<ProjectSettings | null>(null)
  const [formState, setFormState] = React.useState<SettingsFormState | null>(null)

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

    if (open) {
      void loadSettings()
    }
  }, [open, projectId])

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen && settings) {
      setFormState(createInitialFormState(settings))
    }
  }, [settings])

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

  const handleSubmit = React.useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!formState) return

    console.groupCollapsed("Project settings saved")
    console.log("Project ID", projectId)
    console.log("Selected milestones", Array.from(formState.selectedMilestones))
    console.log("Titleblock file", formState.titleblockFile ?? formState.titleblockTemplateUrl)
    console.log("Document naming convention", formState.documentNamingConvention)
    console.log("Document code location", formState.documentCodeLocation)
    console.log("Statuses", formState.statuses)
    console.log("Importances", formState.importances)
    console.log("Disciplines", formState.disciplines)
    console.log("States", formState.states)
    console.log("Suitabilities", formState.suitabilities)
    console.log("Default review times", formState.defaultReviewTimes)
    console.log("Default response periods", formState.defaultResponsePeriods)
    console.groupEnd()

    setOpen(false)
  }, [formState, projectId])

  const isLoading = open && (!settings || !formState)

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button variant="outline" size="sm">
            <Settings2 className="size-4" />
            <span>Project settings</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full max-w-3xl flex-col">
        <SheetHeader className="border-b pb-4">
          <SheetTitle>Project settings</SheetTitle>
          <SheetDescription>
            Configure the milestones, document standards, and review defaults used by this project.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
              Loading settings...
            </div>
          ) : (
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
                      {settings.availableMilestones.length ? (
                        settings.availableMilestones.map((milestone) => (
                          <label
                            key={milestone}
                            className="border-border hover:border-primary/50 flex items-start gap-3 rounded-lg border bg-card p-3 transition"
                          >
                            <Checkbox
                              checked={formState.selectedMilestones.has(milestone)}
                              onCheckedChange={(checked) => toggleMilestone(milestone, Boolean(checked))}
                            />
                            <div>
                              <p className="font-medium">{milestone}</p>
                              <p className="text-muted-foreground text-xs">Enable or disable this milestone for the team.</p>
                            </div>
                          </label>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm">No milestones found for this project.</p>
                      )}
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
          )}
        </div>

        <SheetFooter className="border-t bg-muted/40">
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs">
              Changes apply to future reviews; existing reviews keep their current configuration.
            </p>
            <Button type="submit" form="project-settings-form" disabled={isLoading || !formState}>
              Save settings
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
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
    <div className="border-border flex flex-col gap-2 rounded-lg border bg-card p-4 shadow-xs">
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

