"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

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
import { supabase } from "@/lib/supabase/client"
import { Loader2, X, Clock, CheckCircle2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getProjectPhases, getProjectWorkflows } from "@/lib/actions/workflow"
import type { ProjectReviewPhase } from "@/lib/db/types"
import { Badge } from "@/components/ui/badge"

type ReviewFormState = {
  reviewName: string
  reviewNumber: string
  milestone: string
  projectId: string
  dueSmeComments: string
  dueIssueConsultant: string
  dueConsultantReplies: string
  workflowId: string
}

type ProjectOption = {
  id: string
  name: string
  code: string
  slug: string | null
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

const createInitialFormState = (projectId: string = ""): ReviewFormState => ({
  reviewName: "",
  reviewNumber: "",
  milestone: "",
  projectId,
  dueSmeComments: "",
  dueIssueConsultant: "",
  dueConsultantReplies: "",
  workflowId: "",
})

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
      workflowId: "",
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
      workflowId: "",
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
      workflowId: "",
    },
    selectedUsers: {
      "Review Lead": ["Alex Green"],
      "Marine SME": ["Priya Shah"],
      "MEP SME": ["Taylor King"],
    },
    existingDocumentIds: ["doc-005", "doc-004"],
  },
]

export type CreateReviewWizardProps = {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
  initialProjectId?: string
}

export function CreateReviewWizard({
  open: propOpen,
  onOpenChange: propOnOpenChange,
  showTrigger = true,
  initialProjectId = "",
}: CreateReviewWizardProps) {
  const router = useRouter()
  const [internalOpen, setInternalOpen] = React.useState(false)

  const open = propOpen !== undefined ? propOpen : internalOpen
  const setOpen = propOnOpenChange !== undefined ? propOnOpenChange : setInternalOpen

  const [step, setStep] = React.useState<1 | 2>(1)
  const [formState, setFormState] = React.useState<ReviewFormState>(
    () => createInitialFormState(initialProjectId)
  )
  const [selectedUsers, setSelectedUsers] = React.useState<
    Record<string, string[]>
  >({})
  const [selectedExistingDocs, setSelectedExistingDocs] = React.useState<
    string[]
  >([])
  const [uploads, setUploads] = React.useState<ReviewUpload[]>([])
  const [recentTemplateId, setRecentTemplateId] = React.useState<string>("")
  const [projects, setProjects] = React.useState<ProjectOption[]>([])
  const [projectsLoading, setProjectsLoading] = React.useState(false)
  const [projectsError, setProjectsError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitError, setSubmitError] = React.useState<string | null>(null)
  const [workflows, setWorkflows] = React.useState<{ id: string; name: string }[]>([])
  const [workflowsLoading, setWorkflowsLoading] = React.useState(false)
  const [workflowPhases, setWorkflowPhases] = React.useState<ProjectReviewPhase[]>([])
  const [phasesLoading, setPhasesLoading] = React.useState(false)

  React.useEffect(() => {
    let isMounted = true

    const loadProjects = async () => {
      setProjectsLoading(true)
      setProjectsError(null)

      try {
        const { data, error } = await supabase
          .from("projects")
          .select("id, project_name, project_number, slug")
          .order("project_name", { ascending: true })

        if (!isMounted) return

        if (error) {
          throw error
        }

        const mapped: ProjectOption[] = (data ?? []).map((project) => ({
          id: project.id,
          name: project.project_name ?? "Untitled project",
          code: project.project_number ?? "",
          slug: project.slug,
        }))

        setProjects(mapped)
      } catch (error) {
        if (!isMounted) return

        console.error("Failed to load projects", error)
        const message =
          error instanceof Error ? error.message : "Unable to load projects"
        setProjectsError(message)
        setProjects([])
      } finally {
        if (isMounted) {
          setProjectsLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      isMounted = false
    }
  }, [])

  const pendingUploads = React.useMemo(
    () => uploads.some((upload) => upload.status === "uploading"),
    [uploads]
  )

  const currentProject = React.useMemo(
    () => projects.find((project) => project.id === formState.projectId),
    [formState.projectId, projects]
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
    setFormState(createInitialFormState(initialProjectId))
    setSelectedUsers({})
    setSelectedExistingDocs([])
    setUploads([])
    setRecentTemplateId("")
    setWorkflowPhases([])
    setSubmitError(null)
  }, [initialProjectId])

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen)

    if (!nextOpen) {
      resetWizard()
    } else if (initialProjectId) {
      // Load workflows for the initial project when opened
      loadWorkflowsForProject(initialProjectId)
    }
  }

  const loadWorkflowsForProject = React.useCallback(async (pid: string) => {
    setWorkflowsLoading(true)
    try {
      const result = await getProjectWorkflows(pid)
      if (result.success && result.workflows) {
        setWorkflows(result.workflows)
        if (result.workflows.length > 0) {
          const firstWfId = result.workflows[0].id
          setFormState(prev => ({ ...prev, workflowId: firstWfId }))
          // Load phases for the first workflow
          loadPhasesForWorkflow(pid, firstWfId)
        } else {
          setFormState(prev => ({ ...prev, workflowId: "" }))
          setWorkflowPhases([])
        }
      } else {
        setWorkflows([])
        setFormState(prev => ({ ...prev, workflowId: "" }))
        setWorkflowPhases([])
      }
    } catch (error) {
      console.error("Failed to load workflows", error)
      setWorkflows([])
    } finally {
      setWorkflowsLoading(false)
    }
  }, [])

  const loadPhasesForWorkflow = React.useCallback(async (pid: string, workflowId: string) => {
    if (!pid || !workflowId) {
      setWorkflowPhases([])
      return
    }
    
    setPhasesLoading(true)
    try {
      const result = await getProjectPhases(pid, workflowId)
      if (result.success && result.phases) {
        setWorkflowPhases(result.phases)
      } else {
        setWorkflowPhases([])
      }
    } catch (error) {
      console.error("Failed to load phases", error)
      setWorkflowPhases([])
    } finally {
      setPhasesLoading(false)
    }
  }, [])

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
      workflowId: "", // Reset workflow when project changes
    }))
    setSelectedUsers({})
    setSelectedExistingDocs([])
    setWorkflowPhases([])
    setSubmitError(null)

    // Load workflows for the selected project
    if (value) {
      loadWorkflowsForProject(value)
    } else {
      setWorkflows([])
    }
  }

  const handleWorkflowChange = (value: string) => {
    handleFieldChange("workflowId", value)
    if (formState.projectId && value) {
      loadPhasesForWorkflow(formState.projectId, value)
    } else {
      setWorkflowPhases([])
    }
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
    setSelectedUsers((prev) => ({
      ...prev,
      [role]: shouldSelectAll ? [...(prev[role] ?? [])] : [],
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

    const projectId = projects.some((project) => project.id === template.formState.projectId)
      ? template.formState.projectId
      : ""

    setFormState({
      ...template.formState,
      projectId,
    })
    setSelectedUsers(template.selectedUsers)
    setSelectedExistingDocs(template.existingDocumentIds)
  }

  const handleComplete = async () => {
    if (isSubmitting) return

    const trimmedReviewName = formState.reviewName.trim()
    const trimmedReviewNumber = formState.reviewNumber.trim()
    const trimmedMilestone = formState.milestone.trim()

    if (!trimmedReviewName) {
      setSubmitError("Review name is required.")
      setStep(1)
      return
    }

    if (!formState.projectId) {
      setSubmitError("Select a project for this review.")
      setStep(1)
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reviewName: trimmedReviewName,
          reviewNumber: trimmedReviewNumber || null,
          milestone: trimmedMilestone || null,
          dueDateSmeReview: formState.dueSmeComments || null,
          dueDateIssueComments: formState.dueIssueConsultant || null,
          dueDateReplies: formState.dueConsultantReplies || null,
          projectId: formState.projectId,
          workflowId: formState.workflowId || null,
          documents: uploads.map((u) => ({ name: u.name, size: u.size })),
        }),
      })

      const result = (await response.json().catch(() => ({}))) as {
        review?: { id?: string; slug?: string }
        error?: string
      }

      if (!response.ok) {
        const message = result.error ?? "Unable to create review."
        throw new Error(message)
      }

      if (pendingUploads) {
        console.log(
          "Uploads still in progress; they will continue in the background.",
          uploads.filter((upload) => upload.status === "uploading")
        )
      }

      setOpen(false)
      resetWizard()

      if (result.review?.slug) {
        router.push(`/${currentProject?.slug || formState.projectId}/${result.review.slug}`)
      } else if (result.review?.id) {
        router.push(`/${currentProject?.slug || formState.projectId}/${result.review.id}`)
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create review."
      setSubmitError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {showTrigger && (
        <SheetTrigger asChild>
          <Button className="w-full justify-between" size="lg" variant="secondary">
            Create new review
          </Button>
        </SheetTrigger>
      )}
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
                <Label htmlFor="project">Project</Label>
                <Select value={formState.projectId} onValueChange={handleProjectChange}>
                  <SelectTrigger id="project" className="w-full">
                    <SelectValue placeholder={projectsLoading ? "Loading projects..." : "Select a project"} />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                          {project.code ? ` (${project.code})` : ""}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        No projects found
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {projectsError ? (
                  <p className="text-destructive text-xs font-medium">
                    {projectsError}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="recent-review">Copy settings from a recent review</Label>
                <Select value={recentTemplateId} onValueChange={handleRecentTemplateChange}>
                  <SelectTrigger id="recent-review" className="w-full">
                    <SelectValue placeholder="Select a recent review" />
                  </SelectTrigger>
                  <SelectContent>
                    {recentReviewTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label htmlFor="workflow">Review Workflow</Label>
                <Select
                  value={formState.workflowId}
                  onValueChange={handleWorkflowChange}
                  disabled={!formState.projectId || workflowsLoading}
                >
                  <SelectTrigger id="workflow" className="w-full">
                    <SelectValue
                      placeholder={
                        workflowsLoading ? "Loading templates..." : !formState.projectId ? "Select a project first" : "Select a workflow"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {workflows.length > 0 ? (
                      workflows.map((wf) => (
                        <SelectItem key={wf.id} value={wf.id}>
                          {wf.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        {workflowsLoading ? "Loading workflows..." : "No workflows found"}
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  The selected template determines the review phases and their durations.
                </p>

                {/* Workflow Phases Display */}
                {formState.workflowId && workflowPhases.length > 0 && (
                  <div className="mt-4 rounded-lg border bg-muted/30 p-4">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Workflow Phases
                    </p>
                    <div className="space-y-3">
                      {workflowPhases.map((phase, index) => (
                        <div key={phase.id} className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary border border-primary/20">
                              {index + 1}
                            </div>
                            {index !== workflowPhases.length - 1 && (
                              <div className="h-6 w-px bg-border my-1" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{phase.phase_name}</p>
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {phase.duration_days} days
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {phasesLoading && (
                  <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Loading phase details...
                  </div>
                )}
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
                  Object.keys(selectedUsers).length ? (
                    <div className="space-y-6">
                      {Object.entries(selectedUsers).map(([role, users]) => (
                        <div key={role} className="space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-semibold">{role}</p>
                              <p className="text-muted-foreground text-xs">
                                Adjust contributors for this discipline.
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
                            {users.length ? (
                              users.map((user) => {
                                const checkboxId = `${role}-${user}`

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
                                      checked
                                      onCheckedChange={(value) =>
                                        handleUserToggle(role, user, Boolean(value))
                                      }
                                      aria-label={`Assign ${user} to ${role}`}
                                    />
                                  </div>
                                )
                              })
                            ) : (
                              <p className="text-muted-foreground text-xs">
                                No users selected yet for this role.
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
                      Team assignments can be configured after creating the review.
                    </div>
                  )
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
                <Button onClick={handleComplete} disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Complete"}
                </Button>
              )}
              {submitError ? (
                <p className="text-destructive text-xs font-medium">{submitError}</p>
              ) : null}
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}


