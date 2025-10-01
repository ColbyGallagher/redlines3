"use client"

import * as React from "react"

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

type ContractType = "Concept design" | "Detailed design" | "Construction"

type CreateProjectFormState = {
  projectName: string
  projectNumber: string
  projectStatus: string
  parentProject: string
  contractType: ContractType | ""
}

const initialFormState: CreateProjectFormState = {
  projectName: "",
  projectNumber: "",
  projectStatus: "",
  parentProject: "",
  contractType: "",
}

const contractTypes: ContractType[] = [
  "Concept design",
  "Detailed design",
  "Construction",
]

const placeholderTeams: Record<string, string[]> = {
  Structures: ["Alex Green", "Jordan Wu", "Priya Shah"],
  "Project Management": ["Maya Lopez", "Chris Bennett", "Nora Patel"],
  "Road Design": ["Samuel Lee", "Ivy Carter"],
  Electrical: ["Reese Morgan", "Taylor King"],
}

export function CreateProjectWizard() {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<1 | 2>(1)
  const [formState, setFormState] = React.useState<CreateProjectFormState>(
    initialFormState
  )
  const [selectedUsers, setSelectedUsers] = React.useState<
    Record<string, string[]>
  >({})

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      resetWizard()
    }
  }

  const resetWizard = () => {
    setStep(1)
    setFormState(initialFormState)
    setSelectedUsers({})
  }

  const handleInputChange = (
    field: keyof CreateProjectFormState,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleUserToggle = (
    role: string,
    user: string,
    checked: boolean
  ) => {
    setSelectedUsers((prev) => {
      const existing = new Set(prev[role] ?? [])

      if (checked) {
        existing.add(user)
      } else {
        existing.delete(user)
      }

      return {
        ...prev,
        [role]: Array.from(existing),
      }
    })
  }

  const handleNext = () => {
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleComplete = () => {
    console.log("Project created", {
      details: formState,
      teamAssignments: selectedUsers,
    })

    setOpen(false)
    resetWizard()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button className="w-full justify-between" size="lg">
          Create new project
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Create new project</SheetTitle>
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Step {step} of 2
            </span>
          </div>
          <SheetDescription>
            {step === 1
              ? "Add the core project information to get started."
              : "Optionally assign placeholder collaborators by discipline."
            }
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
          {step === 1 ? (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input
                  id="project-name"
                  placeholder="e.g. Riverside Connector"
                  value={formState.projectName}
                  onChange={(event) =>
                    handleInputChange("projectName", event.target.value)
                  }
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="project-number">Project number</Label>
                  <Input
                    id="project-number"
                    placeholder="e.g. PRJ-2048"
                    value={formState.projectNumber}
                    onChange={(event) =>
                      handleInputChange("projectNumber", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="project-status">Project status</Label>
                  <Input
                    id="project-status"
                    placeholder="e.g. In planning"
                    value={formState.projectStatus}
                    onChange={(event) =>
                      handleInputChange("projectStatus", event.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parent-project">
                  Parent project or program of works
                </Label>
                <Input
                  id="parent-project"
                  placeholder="e.g. Northern Corridor Upgrade"
                  value={formState.parentProject}
                  onChange={(event) =>
                    handleInputChange("parentProject", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contract-type">Contract type</Label>
                <select
                  id="contract-type"
                  value={formState.contractType}
                  onChange={(event) =>
                    handleInputChange(
                      "contractType",
                      event.target.value as ContractType | ""
                    )
                  }
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 text-foreground bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs transition-colors outline-none"
                >
                  <option value="">Select a contract type</option>
                  {contractTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(placeholderTeams).map(([role, users]) => (
                <div key={role} className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold">{role}</p>
                    <p className="text-muted-foreground text-xs">
                      Select any placeholder contributors for this discipline.
                    </p>
                  </div>
                  <div className="space-y-2 rounded-md border p-3">
                    {users.map((user) => {
                      const checkboxId = `${role}-${user}`
                      const checked = selectedUsers[role]?.includes(user) ?? false

                      return (
                        <div
                          key={user}
                          className="flex items-center justify-between gap-2 rounded-sm border border-transparent px-2 py-1.5 transition-colors hover:border-input"
                        >
                          <Label
                            htmlFor={checkboxId}
                            className="flex-1 text-sm font-medium"
                          >
                            {user}
                          </Label>
                          <Checkbox
                            id={checkboxId}
                            checked={checked}
                            onCheckedChange={(value) =>
                              handleUserToggle(role, user, Boolean(value))
                            }
                            aria-label={`Assign ${user} to ${role}`}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
              <Separator />
              <p className="text-muted-foreground text-xs">
                You can always update project teams later from the project
                workspace.
              </p>
            </div>
          )}
        </div>

        <SheetFooter className="border-t">
          <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-2">
              {step === 2 ? (
                <Button variant="ghost" onClick={handleBack}>
                  Back
                </Button>
              ) : (
                <Button variant="ghost" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex gap-2 md:ml-auto">
              {step === 1 ? (
                <Button onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button onClick={handleComplete}>
                  Complete
                </Button>
              )}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}


