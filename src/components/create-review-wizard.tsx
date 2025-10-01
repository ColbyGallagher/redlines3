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
import { Loader2, X } from "lucide-react"

type ReviewFormState = {
  reviewName: string
  reviewNumber: string
  milestone: string
  projectId: string
  dueSmeComments: string
  dueIssueConsultant: string
  dueConsultantReplies: string
}

type ProjectDirectory = {
  id: string
  name: string
  code: string
  roles: Record<string, string[]>
}

type ReviewUpload = {
  id: string
  name: string
  size: number
  status: "uploading" | "uploaded" | "error"
}

type RecentReviewTemplate = {
  id: string
  label: string
  formState: ReviewFormState
  selectedUsers: Record<string, string[]>
  existingDocumentIds: string[]
}

type ExistingDocument = {
  id: string
  name: string
  category: string
  projectId: string
}

const createInitialFormState = (): ReviewFormState => ({
  reviewName: "",
  reviewNumber: "",
  milestone: "",
  projectId: "",
  dueSmeComments: "",
  dueIssueConsultant: "",
  dueConsultantReplies: "",
})

const projectDirectory: ProjectDirectory[] = [
  {
    id: "proj-001",
    name: "Riverside Connector",
    code: "RC-2048",
    roles: {
      "Review Lead": ["Alex Green", "Maya Lopez"],
      "Structural SME": ["Priya Shah", "Jordan Wu"],
      "Electrical SME": ["Reese Morgan", "Taylor King"],
      "Project Controls": ["Chris Bennett"],
    },
  },
  {
    id: "proj-002",
    name: "Northern Corridor Upgrade",
    code: "NC-301",
    roles: {
      "Review Lead": ["Samuel Lee"],
      "Civil SME": ["Ivy Carter", "Noah Patel"],
      "Client Liaison": ["Nora Patel"],
      "Quality Assurance": ["Jordan Wu"],
    },
  },
  {
    id: "proj-003",
    name: "Harbor Modernization",
    code: "HM-118",
    roles: {
      "Review Lead": ["Alex Green"],
      "Marine SME": ["Priya Shah", "Samuel Lee"],
      "MEP SME": ["Taylor King"],
      "Project Controls": ["Maya Lopez"],
    },
  },
]

const existingDocuments: ExistingDocument[] = [
  {
    id: "doc-001",
    name: "Structural Markups v3.pdf",
    category: "Structural",
    projectId: "proj-001",
  },
  {
    id: "doc-002",
    name: "Electrical Layout Set.dwg",
    category: "Electrical",
    projectId: "proj-001",
  },
  {
    id: "doc-003",
    name: "Corridor Staging Plan.pdf",
    category: "Civil",
    projectId: "proj-002",
  },
  {
    id: "doc-004",
    name: "Client Comment Summary.xlsx",
    category: "Client",
    projectId: "shared",
  },
  {
    id: "doc-005",
    name: "Harbor Utilities Update.dwg",
    category: "MEP",
    projectId: "proj-003",
  },
  {
    id: "doc-006",
    name: "QA Checklist Template.docx",
    category: "Quality",
    projectId: "shared",
  },
]

const recentReviewTemplates: RecentReviewTemplate[] = [
  {
    id: "recent-001",
    label: "Lobby Renovation - RC-2048",
    formState: {
      reviewName: "Lobby Renovation",
      reviewNumber: "REV-2048-A",
      milestone: "60% Design Review",
      projectId: "proj-001",
      dueSmeComments: "2025-10-07",
      dueIssueConsultant: "2025-10-10",
      dueConsultantReplies: "2025-10-18",
    },
    selectedUsers: {
      "Review Lead": ["Alex Green"],
      "Structural SME": ["Priya Shah"],
      "Electrical SME": ["Reese Morgan"],
    },
    existingDocumentIds: ["doc-001", "doc-004"],
  },
  {
    id: "recent-002",
    label: "Bridge Package QA - NC-301",
    formState: {
      reviewName: "Bridge Package QA",
      reviewNumber: "REV-301-B",
      milestone: "Issued for Approval",
      projectId: "proj-002",
      dueSmeComments: "2025-10-04",
      dueIssueConsultant: "2025-10-06",
      dueConsultantReplies: "2025-10-13",
    },
    selectedUsers: {
      "Review Lead": ["Samuel Lee"],
      "Civil SME": ["Ivy Carter", "Noah Patel"],
      "Quality Assurance": ["Jordan Wu"],
    },
    existingDocumentIds: ["doc-003", "doc-006"],
  },
  {
    id: "recent-003",
    label: "Pier Lighting Review - HM-118",
    formState: {
      reviewName: "Pier Lighting Review",
      reviewNumber: "REV-118-C",
      milestone: "Consultant Comments",
      projectId: "proj-003",
      dueSmeComments: "2025-09-29",
      dueIssueConsultant: "2025-10-02",
      dueConsultantReplies: "2025-10-08",
    },
    selectedUsers: {
      "Review Lead": ["Alex Green"],
      "Marine SME": ["Priya Shah"],
      "MEP SME": ["Taylor King"],
    },
    existingDocumentIds: ["doc-005", "doc-004"],
  },
]

export function CreateReviewWizard() {
  const [open, setOpen] = React.useState(false)
  const [step, setStep] = React.useState<1 | 2>(1)
  const [formState, setFormState] = React.useState<ReviewFormState>(
    () => createInitialFormState()
  )
  const [selectedUsers, setSelectedUsers] = React.useState<
    Record<string, string[]>
  >({})
  const [selectedExistingDocs, setSelectedExistingDocs] = React.useState<
    string[]
  >([])
  const [uploads, setUploads] = React.useState<ReviewUpload[]>([])
  const [recentTemplateId, setRecentTemplateId] = React.useState<string>("")

  const pendingUploads = React.useMemo(
    () => uploads.some((upload) => upload.status === "uploading"),
    [uploads]
  )

  const currentProject = React.useMemo(
    () => projectDirectory.find((project) => project.id === formState.projectId),
    [formState.projectId]
  )

  const availableDocuments = React.useMemo(() => {
    if (!formState.projectId) {
      return existingDocuments.filter((doc) => doc.projectId === "shared")
    }

    return existingDocuments.filter(
      (doc) => doc.projectId === formState.projectId || doc.projectId === "shared"
    )
  }, [formState.projectId])

  const resetWizard = React.useCallback(() => {
    setStep(1)
    setFormState(createInitialFormState())
    setSelectedUsers({})
    setSelectedExistingDocs([])
    setUploads([])
    setRecentTemplateId("")
  }, [])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      resetWizard()
    }
  }

  const handleFieldChange = (
    field: keyof ReviewFormState,
    value: string
  ) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleProjectChange = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      projectId: value,
    }))
    setSelectedUsers({})
    setSelectedExistingDocs([])
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

  const handleRoleSelection = (role: string, shouldSelectAll: boolean) => {
    if (!currentProject) return

    const usersForRole = currentProject.roles[role] ?? []

    setSelectedUsers((prev) => ({
      ...prev,
      [role]: shouldSelectAll ? [...usersForRole] : [],
    }))
  }

  const handleExistingDocumentToggle = (docId: string, checked: boolean) => {
    setSelectedExistingDocs((prev) => {
      const exists = prev.includes(docId)

      if (checked && !exists) {
        return [...prev, docId]
      }

      if (!checked && exists) {
        return prev.filter((id) => id !== docId)
      }

      return prev
    })
  }

  const simulateUploadCompletion = (uploadId: string) => {
    const timeout = 1200 + Math.random() * 1600

    window.setTimeout(() => {
      setUploads((prev) =>
        prev.map((upload) =>
          upload.id === uploadId
            ? {
                ...upload,
                status: "uploaded",
              }
            : upload
        )
      )
    }, timeout)
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files

    if (!files?.length) return

    const newUploads: ReviewUpload[] = Array.from(files).map((file) => {
      const id = `${file.name}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`

      return {
        id,
        name: file.name,
        size: file.size,
        status: "uploading",
      }
    })

    setUploads((prev) => [...prev, ...newUploads])
    event.target.value = ""

    newUploads.forEach((upload) => {
      simulateUploadCompletion(upload.id)
    })
  }

  const handleRemoveUpload = (uploadId: string) => {
    setUploads((prev) => prev.filter((upload) => upload.id !== uploadId))
  }

  const handleNext = () => {
    setStep(2)
  }

  const handleBack = () => {
    setStep(1)
  }

  const handleRecentTemplateChange = (value: string) => {
    setRecentTemplateId(value)

    if (!value) {
      setFormState(createInitialFormState())
      setSelectedUsers({})
      setSelectedExistingDocs([])
      return
    }

    const template = recentReviewTemplates.find((item) => item.id === value)

    if (!template) return

    setFormState(template.formState)
    setSelectedUsers(template.selectedUsers)
    setSelectedExistingDocs(template.existingDocumentIds)
  }

  const handleComplete = () => {
    console.log("Review created", {
      details: formState,
      assignments: selectedUsers,
      documents: {
        existing: selectedExistingDocs,
        uploads,
      },
      template: recentTemplateId || "manual",
    })

    if (pendingUploads) {
      console.log(
        "Uploads still in progress; they will continue in the background.",
        uploads.filter((upload) => upload.status === "uploading")
      )
    }

    setOpen(false)
    resetWizard()
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button className="w-full justify-between" size="lg" variant="secondary">
          Create new review
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="sm:max-w-xl">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Create new review</SheetTitle>
            <span className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
              Step {step} of 2
            </span>
          </div>
          <SheetDescription>
            {step === 1
              ? "Capture the core review details or reuse a recent configuration."
              : "Assign participants and attach supporting documents."
            }
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="recent-review">Copy settings from a recent review</Label>
                <select
                  id="recent-review"
                  value={recentTemplateId}
                  onChange={(event) =>
                    handleRecentTemplateChange(event.target.value)
                  }
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 text-foreground bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs transition-colors outline-none"
                >
                  <option value="">Select a recent review</option>
                  {recentReviewTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.label}
                    </option>
                  ))}
                </select>
                <p className="text-muted-foreground text-xs">
                  Reuse the same milestones, due dates, users, and documents from a recent setup.
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="review-name">Review name</Label>
                <Input
                  id="review-name"
                  placeholder="e.g. Lobby Renovation"
                  value={formState.reviewName}
                  onChange={(event) =>
                    handleFieldChange("reviewName", event.target.value)
                  }
                />
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="review-number">Review number</Label>
                  <Input
                    id="review-number"
                    placeholder="e.g. REV-2048-A"
                    value={formState.reviewNumber}
                    onChange={(event) =>
                      handleFieldChange("reviewNumber", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="milestone">Milestone</Label>
                  <Input
                    id="milestone"
                    placeholder="e.g. 60% Design Review"
                    value={formState.milestone}
                    onChange={(event) =>
                      handleFieldChange("milestone", event.target.value)
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <select
                  id="project"
                  value={formState.projectId}
                  onChange={(event) => handleProjectChange(event.target.value)}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] dark:bg-input/30 text-foreground bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs transition-colors outline-none"
                >
                  <option value="">Select a project</option>
                  {projectDirectory.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.code})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="due-sme">Due date for SME comments</Label>
                  <Input
                    id="due-sme"
                    type="date"
                    value={formState.dueSmeComments}
                    onChange={(event) =>
                      handleFieldChange("dueSmeComments", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due-issue">Due date for issuing to consultant</Label>
                  <Input
                    id="due-issue"
                    type="date"
                    value={formState.dueIssueConsultant}
                    onChange={(event) =>
                      handleFieldChange(
                        "dueIssueConsultant",
                        event.target.value
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="due-replies">Due date for replies from consultant</Label>
                <Input
                  id="due-replies"
                  type="date"
                  value={formState.dueConsultantReplies}
                  onChange={(event) =>
                    handleFieldChange(
                      "dueConsultantReplies",
                      event.target.value
                    )
                  }
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Team assignments</p>
                  <p className="text-muted-foreground text-xs">
                    Select specific users or entire roles from the chosen project.
                  </p>
                </div>
                {currentProject ? (
                  <div className="space-y-6">
                    {Object.entries(currentProject.roles).map(([role, users]) => {
                      const assignedUsers = selectedUsers[role] ?? []

                      return (
                        <div key={role} className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{role}</p>
                              <p className="text-muted-foreground text-xs">
                                Assign by person or select the full discipline.
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRoleSelection(role, true)}
                                className="h-8"
                              >
                                Select all
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRoleSelection(role, false)}
                                className="h-8"
                              >
                                Clear
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2 rounded-md border p-3">
                            {users.map((user) => {
                              const checkboxId = `${role}-${user}`
                              const checked = assignedUsers.includes(user)

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
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
                    Choose a project in Step 1 to load available team members.
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Documents</p>
                  <p className="text-muted-foreground text-xs">
                    Attach documents already in the workspace or upload new ones.
                  </p>
                </div>
                {availableDocuments.length > 0 ? (
                  <div className="space-y-2 rounded-md border p-3">
                    {availableDocuments.map((document) => {
                      const checkboxId = `existing-doc-${document.id}`
                      const isChecked = selectedExistingDocs.includes(document.id)

                      return (
                        <div
                          key={document.id}
                          className="flex items-center justify-between gap-2 rounded-sm border border-transparent px-2 py-1.5 transition-colors hover:border-input"
                        >
                          <Label
                            htmlFor={checkboxId}
                            className="flex flex-1 flex-col text-sm font-medium"
                          >
                            <span>{document.name}</span>
                            <span className="text-muted-foreground text-xs">
                              {document.category}
                            </span>
                          </Label>
                          <Checkbox
                            id={checkboxId}
                            checked={isChecked}
                            onCheckedChange={(value) =>
                              handleExistingDocumentToggle(
                                document.id,
                                Boolean(value)
                              )
                            }
                            aria-label={`Include ${document.name}`}
                          />
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
                    No shared documents available yet. Upload new files below.
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="document-upload" className="text-sm font-medium">
                    Upload new documents
                  </Label>
                  <Input
                    id="document-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                  />
                  <p className="text-muted-foreground text-xs">
                    Uploads finish in the background so you can complete the form immediately.
                  </p>
                </div>
                {uploads.length > 0 && (
                  <div className="space-y-2 rounded-md border border-dashed p-3">
                    {uploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center justify-between gap-3 rounded-sm border border-transparent px-2 py-1.5"
                      >
                        <div>
                          <p className="text-sm font-medium">{upload.name}</p>
                          <p className="text-muted-foreground text-xs">
                            {upload.status === "uploading"
                              ? "Uploading in background"
                              : "Uploaded and ready"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {upload.status === "uploading" ? (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          ) : (
                            <span className="text-muted-foreground text-xs">
                              Ready
                            </span>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleRemoveUpload(upload.id)}
                            aria-label={`Remove ${upload.name}`}
                          >
                            <X className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
            <div className="flex flex-col gap-2 md:ml-auto md:items-end">
              {pendingUploads && (
                <p className="text-muted-foreground text-xs">
                  {"Uploads continue after submission; we'll notify collaborators automatically."}
                </p>
              )}
              {step === 1 ? (
                <Button onClick={handleNext}>Next</Button>
              ) : (
                <Button onClick={handleComplete}>Complete</Button>
              )}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}


