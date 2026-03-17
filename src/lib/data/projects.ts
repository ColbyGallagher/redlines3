import "server-only"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database, ProjectMilestone, ProjectStatus, ProjectImportance, ProjectDiscipline, ProjectState, ProjectSuitability, ProjectReviewStage, ProjectResponseRole, ProjectPackage, ProjectClassification } from "@/lib/db/types"
import type { ReviewUser } from "./reviews"
import { formatName, toTitleCaseFallback } from "@/lib/utils/user-utils"

const MS_PER_DAY = 1000 * 60 * 60 * 24
const UPCOMING_REVIEW_WINDOW_DAYS = 7
const LONG_OPEN_ISSUE_DAYS = 14

const ACTIVE_REVIEW_STATUSES = new Set(["Draft", "In Review", "Awaiting Client", "Flagged"])
const ACTIVE_ISSUE_STATUSES = new Set(["Open", "In Progress"])
const CLOSED_ISSUE_STATUS = "Closed"

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"]
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"]
type DocumentRow = Database["public"]["Tables"]["documents"]["Row"]
type IssueRow = Database["public"]["Tables"]["issues"]["Row"]

type ReviewWithRelations = ReviewRow & {
  documents: DocumentRow[] | null
  issues: IssueRow[] | null
}

type ProjectUserRow = Database["public"]["Tables"]["project_users"]["Row"] & {
  user: Database["public"]["Tables"]["users"]["Row"] | null
  roles: Database["public"]["Tables"]["roles"]["Row"] | null
}

type ProjectWithRelations = ProjectRow & {
  reviews: ReviewWithRelations[] | null
  project_milestones: ProjectMilestone[] | null
  project_statuses: ProjectStatus[] | null
  project_importances: ProjectImportance[] | null
  project_disciplines: ProjectDiscipline[] | null
  project_states: ProjectState[] | null
  project_suitabilities: ProjectSuitability[] | null
  project_review_stages: ProjectReviewStage[] | null
  project_response_roles: ProjectResponseRole[] | null
  project_users: ProjectUserRow[] | null
}

type NormalizedReview = {
  id: string
  reviewName: string
  reviewNumber: string
  milestone: string
  status: string
  dueDateSmeReview?: string
  dueDateIssueComments?: string
  dueDateReplies?: string
  project: {
    id: string
    projectNumber: string
    projectName: string
    projectLocation: string | null
  }
  documents: NormalizedDocument[]
  issues: NormalizedIssue[]
  lastUpdated?: string | null
}

type NormalizedDocument = {
  id: string
  documentName: string
  documentCode?: string | null
  state?: string | null
  milestone?: string | null
  suitability?: string | null
  version?: string | null
  revision?: string | null
  pdfUrl?: string | null
  fileSize?: string | null
  uploadedAt?: string | null
}

type NormalizedIssue = {
  id: string
  issueNumber: string
  status: string
  importance: string
  discipline: string
  dateCreated?: string | null
  dateModified?: string | null
  documentId?: string | null
  reviewId: string
  projectId: string
  comment?: string | null
  commentCoordinates?: string | null
  pageNumber?: number | null
}

export type ProjectReviewSummary = {
  id: string
  reviewName: string
  milestone: string
  status: string
  dueDate?: string
  dueDateType?: "client" | "consultant" | "reply"
  daysUntilDue?: number
  isOverdue: boolean
  isUpcoming: boolean
}

export type ProjectIssueSummary = {
  id: string
  issueNumber: string
  status: string
  importance: string
  discipline: string
  dateCreated: string
  dateModified: string
  ageDays: number
  isHighPriority: boolean
  isLongOpen: boolean
  reviewId: string
}

export type ProjectInsight = {
  id: string
  title: string
  description: string
  severity: "low" | "medium" | "high"
  relatedReviewIds?: string[]
  relatedIssueIds?: string[]
}

export type ProjectMetrics = {
  totalReviews: number
  overdueReviews: number
  upcomingReviews: number
  totalIssues: number
  openIssues: number
  highPriorityIssues: number
  longOpenIssues: number
  closedIssues: number
}

export type Milestone = {
  id: string
  name: string
  description?: string
}

export type ProjectSettings = {
  availableMilestones: Milestone[]
  selectedMilestones: string[]
  titleblockTemplateUrl?: string
  documentNamingConvention: string
  documentCodeLocation: string
  statuses: ProjectStatus[]
  importances: ProjectImportance[]
  disciplines: ProjectDiscipline[]
  states: ProjectState[]
  suitabilities: ProjectSuitability[]
  packages: ProjectPackage[]
  classifications: ProjectClassification[]
  defaultReviewTimes: { stage: string; days: number }[]
  defaultResponsePeriods: { role: string; days: number }[]
}

type ProjectRowWithSettings = ProjectRow & {
  settings: ProjectSettings | null
}

export type ProjectSummary = {
  project: {
    id: string
    projectNumber: string
    projectName: string
    projectLocation: string | null
    status: string | null
    contractType: string | null
    parentProject: string | null
  }
  members: ReviewUser[]
  metrics: ProjectMetrics
  reviews: ProjectReviewSummary[]
  issues: ProjectIssueSummary[]
  insights: ProjectInsight[]
  lastUpdated: string
  settings: ProjectSettings
  allReviewDocuments: { id: string; name: string; code: string | null }[]
}

type PrimaryDueDateType = "client" | "consultant" | "reply"

type PrimaryDueDate = {
  date: Date
  type: PrimaryDueDateType
}

function mapReview(row: ReviewWithRelations, project: ProjectWithRelations): NormalizedReview {
  return {
    id: row.id,
    reviewName: row.review_name,
    reviewNumber: row.review_number,
    milestone: row.milestone ?? "Unspecified",
    status: row.status ?? "Draft",
    dueDateSmeReview: row.due_date_sme_review ?? undefined,
    dueDateIssueComments: row.due_date_issue_comments ?? undefined,
    dueDateReplies: row.due_date_replies ?? undefined,
    project: {
      id: project.id,
      projectNumber: project.project_number,
      projectName: project.project_name,
      projectLocation: project.project_location ?? null,
    },
    documents: (row.documents ?? []).map((document) => ({
      id: document.id,
      documentName: document.document_name,
      documentCode: document.document_code,
      state: document.state,
      milestone: document.milestone,
      suitability: document.suitability,
      version: document.version,
      revision: document.revision,
      pdfUrl: document.pdf_url,
      fileSize: document.file_size ?? null,
      uploadedAt: document.uploaded_at ?? null,
    })),
    issues: (row.issues ?? []).map((issue) => {
      // Resolve UUIDs to names if possible
      const statusObj = (project.project_statuses ?? []).find(s => s.id === issue.status)
      const importanceObj = (project.project_importances ?? []).find(i => i.id === issue.importance)
      const disciplineObj = (project.project_disciplines ?? []).find(d => d.id === issue.discipline)

      return {
        id: issue.id,
        issueNumber: issue.issue_number,
        status: statusObj?.name ?? issue.status_old ?? issue.status ?? "Open",
        importance: importanceObj?.name ?? issue.importance_old ?? issue.importance ?? "Medium",
        discipline: disciplineObj?.name ?? issue.discipline_old ?? issue.discipline ?? "General",
        dateCreated: issue.date_created ?? null,
        dateModified: issue.date_modified ?? issue.date_created ?? null,
        documentId: issue.document_id ?? null,
        reviewId: issue.review_id,
        projectId: issue.project_id,
        comment: issue.comment ?? null,
        commentCoordinates: issue.comment_coordinates ?? null,
        pageNumber: issue.page_number ?? null,
      }
    }),
    lastUpdated: row.updated_at ?? row.created_at ?? null,
  }
}

function parseDate(value: string | undefined | null): Date | undefined {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function getPrimaryDueDate(review: NormalizedReview): PrimaryDueDate | undefined {
  const dueDates: Array<{ date?: Date; type: PrimaryDueDateType }> = [
    { date: parseDate(review.dueDateSmeReview), type: "client" },
    { date: parseDate(review.dueDateIssueComments), type: "consultant" },
    { date: parseDate(review.dueDateReplies), type: "reply" },
  ]

  const validDates = dueDates.filter((entry): entry is { date: Date; type: PrimaryDueDateType } => Boolean(entry.date))

  if (!validDates.length) {
    return undefined
  }

  validDates.sort((a, b) => a.date.getTime() - b.date.getTime())

  return validDates[0]
}

function calculateReviewSummaries(today: Date, reviews: NormalizedReview[], projectStatuses: ProjectStatus[]): ProjectReviewSummary[] {
  return reviews.map((review) => {
    const primaryDueDate = getPrimaryDueDate(review)
    const dueDate = primaryDueDate?.date
    const dueDateIso = dueDate?.toISOString()

    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY) : undefined
    const isActive = ACTIVE_REVIEW_STATUSES.has(review.status)
    const isOverdue = Boolean(dueDate) && isActive && (dueDate as Date).getTime() < today.getTime()
    const isUpcoming = Boolean(
      daysUntilDue !== undefined &&
      daysUntilDue >= 0 &&
      daysUntilDue <= UPCOMING_REVIEW_WINDOW_DAYS &&
      isActive,
    )

    return {
      id: review.id,
      reviewName: review.reviewName,
      milestone: review.milestone,
      status: (projectStatuses ?? []).find(s => s.id === review.status)?.name ?? review.status,
      dueDate: dueDateIso,
      dueDateType: primaryDueDate?.type,
      daysUntilDue,
      isOverdue,
      isUpcoming,
    }
  })
}

function calculateIssueSummaries(today: Date, reviews: NormalizedReview[]): ProjectIssueSummary[] {
  return reviews.flatMap((review) => {
    return review.issues.map((issue) => {
      const createdAt = parseDate(issue.dateCreated)
      const modifiedAt = parseDate(issue.dateModified)
      const ageDays = createdAt ? Math.max(0, Math.floor((today.getTime() - createdAt.getTime()) / MS_PER_DAY)) : 0
      const isActive = ACTIVE_ISSUE_STATUSES.has(issue.status)
      const importance = issue.importance
      const isHighPriority = importance.toLowerCase() === "high"
      const isLongOpen = isActive && ageDays >= LONG_OPEN_ISSUE_DAYS

      return {
        id: issue.id,
        issueNumber: issue.issueNumber,
        status: issue.status,
        importance,
        discipline: issue.discipline,
        dateCreated: (createdAt ?? new Date(0)).toISOString(),
        dateModified: (modifiedAt ?? createdAt ?? new Date(0)).toISOString(),
        ageDays,
        isHighPriority,
        isLongOpen,
        reviewId: issue.reviewId,
      }
    })
  })
}

function calculateMetrics(reviews: ProjectReviewSummary[], issues: ProjectIssueSummary[]): ProjectMetrics {
  const overdueReviews = reviews.filter((review) => review.isOverdue).length
  const upcomingReviews = reviews.filter((review) => review.isUpcoming).length
  const openIssues = issues.filter((issue) => ACTIVE_ISSUE_STATUSES.has(issue.status)).length
  const highPriorityIssues = issues.filter((issue) => issue.isHighPriority).length
  const longOpenIssues = issues.filter((issue) => issue.isLongOpen).length
  const closedIssues = issues.filter((issue) => issue.status === CLOSED_ISSUE_STATUS).length

  return {
    totalReviews: reviews.length,
    overdueReviews,
    upcomingReviews,
    totalIssues: issues.length,
    openIssues,
    highPriorityIssues,
    longOpenIssues,
    closedIssues,
  }
}

function buildInsights(projectId: string, reviews: ProjectReviewSummary[], issues: ProjectIssueSummary[]): ProjectInsight[] {
  const insights: ProjectInsight[] = []

  const overdueReviews = reviews.filter((review) => review.isOverdue)
  if (overdueReviews.length) {
    const reviewNames = overdueReviews.map((review) => review.reviewName).join(", ")
    insights.push({
      id: `${projectId}-overdue-reviews`,
      title: "Overdue reviews",
      description: `${overdueReviews.length} review${overdueReviews.length > 1 ? "s" : ""} past due: ${reviewNames}.`,
      severity: "high",
      relatedReviewIds: overdueReviews.map((review) => review.id),
    })
  }

  const upcomingReviews = reviews
    .filter((review) => review.isUpcoming && typeof review.daysUntilDue === "number")
    .sort((a, b) => (a.daysUntilDue ?? Number.POSITIVE_INFINITY) - (b.daysUntilDue ?? Number.POSITIVE_INFINITY))

  if (upcomingReviews.length) {
    const nextReview = upcomingReviews[0]
    const days = nextReview.daysUntilDue ?? 0
    insights.push({
      id: `${projectId}-upcoming-review`,
      title: "Upcoming review deadline",
      description: `${nextReview.reviewName} due in ${days} day${days === 1 ? "" : "s"}.`,
      severity: days <= 2 ? "high" : "medium",
      relatedReviewIds: [nextReview.id],
    })
  }

  const longOpenIssues = issues.filter((issue) => issue.isLongOpen)
  if (longOpenIssues.length) {
    const issueIds = longOpenIssues.map((issue) => issue.issueNumber).join(", ")
    insights.push({
      id: `${projectId}-long-open-issues`,
      title: "Issues open for over two weeks",
      description: `${longOpenIssues.length} issue${longOpenIssues.length > 1 ? "s" : ""} active for 14+ days: ${issueIds}.`,
      severity: "medium",
      relatedIssueIds: longOpenIssues.map((issue) => issue.id),
    })
  }

  const highPriorityIssues = issues.filter((issue) => issue.isHighPriority && ACTIVE_ISSUE_STATUSES.has(issue.status))
  if (highPriorityIssues.length) {
    const issueIds = highPriorityIssues.map((issue) => issue.issueNumber).join(", ")
    insights.push({
      id: `${projectId}-high-priority-issues`,
      title: "High-priority issues",
      description: `${highPriorityIssues.length} high-priority issue${highPriorityIssues.length > 1 ? "s" : ""} pending: ${issueIds}.`,
      severity: "high",
      relatedIssueIds: highPriorityIssues.map((issue) => issue.id),
    })
  }

  return insights
}

function deriveSettings(project: ProjectWithRelations): ProjectSettings {
  const availableMilestones = (project.project_milestones ?? []).map(m => ({
    id: m.id,
    name: m.name,
    description: m.description ?? undefined
  }))

  const selectedMilestones = (project.project_milestones ?? [])
    .filter(m => m.is_selected)
    .map(m => m.name)

  return {
    availableMilestones,
    selectedMilestones,
    titleblockTemplateUrl: undefined,
    documentNamingConvention: "<project>-<discipline>-<drawingNumber>-<revision>",
    documentCodeLocation: "Top right corner",
    statuses: project.project_statuses ?? [],
    importances: project.project_importances ?? [],
    disciplines: project.project_disciplines ?? [],
    states: project.project_states ?? [],
    suitabilities: project.project_suitabilities ?? [],
    packages: (project as any).project_packages ?? [],
    classifications: (project as any).project_classifications ?? [],
    defaultReviewTimes: (project.project_review_stages ?? []).map(s => ({ stage: s.stage_name, days: s.days })),
    defaultResponsePeriods: (project.project_response_roles ?? []).map(r => ({ role: r.role_name, days: r.days })),
  }
}

function computeLastUpdated(normalizedReviews: NormalizedReview[], projectFallback?: string | null): string {
  const timestamps: number[] = []

  for (const review of normalizedReviews) {
    const reviewTimestamp = parseDate(review.lastUpdated ?? undefined)?.getTime()
    if (typeof reviewTimestamp === "number") {
      timestamps.push(reviewTimestamp)
    }

    for (const issue of review.issues) {
      const issueTimestamp = parseDate(issue.dateModified ?? undefined)?.getTime()
      if (typeof issueTimestamp === "number") {
        timestamps.push(issueTimestamp)
      }
    }
  }

  if (!timestamps.length) {
    return projectFallback ?? new Date(0).toISOString()
  }

  return new Date(Math.max(...timestamps)).toISOString()
}

function mapProjectMembers(projectUsers: ProjectUserRow[] | null | undefined): ReviewUser[] {
  if (!projectUsers?.length) return []

  return projectUsers.map((entry) => {
    const user = entry.user
    const firstName = formatName(user?.first_name)
    const lastName = formatName(user?.last_name)

    return {
      id: user?.id ?? entry.id,
      firstName,
      lastName,
      email: user?.email ?? "",
      jobTitle: formatName(user?.job_title),
      role: entry.roles?.name ?? entry.role ?? "Member",
      roleId: entry.role_id ?? undefined,
      avatarFallback: toTitleCaseFallback(firstName, lastName),
      company: "ColbyGallagher",
      status: "Active",
    }
  })
}

function mapProjectSummary(project: ProjectWithRelations): ProjectSummary {
  const reviews = (project.reviews ?? []).map((review) => mapReview(review, project))
  const today = new Date()

  const reviewSummaries = calculateReviewSummaries(today, reviews, project.project_statuses ?? [])
  const issueSummaries = calculateIssueSummaries(today, reviews)
  const metrics = calculateMetrics(reviewSummaries, issueSummaries)
  const insights = buildInsights(project.id, reviewSummaries, issueSummaries)
  const lastUpdated = computeLastUpdated(reviews, project.updated_at ?? project.created_at)

  // 1. Get settings (from defaults or database)
  const settings: ProjectSettings = deriveSettings(project)

  // 2. Apply single-value settings from the projects.settings JSONB column if they exist

  // 3. Apply single-value settings from the projects.settings JSONB column if they exist
  const dbSettings = project.settings as any
  if (dbSettings) {
    settings.documentNamingConvention = dbSettings.documentNamingConvention ?? settings.documentNamingConvention
    settings.documentCodeLocation = dbSettings.documentCodeLocation ?? settings.documentCodeLocation
    settings.titleblockTemplateUrl = dbSettings.titleblockTemplateUrl ?? settings.titleblockTemplateUrl
  }

  return {
    project: {
      id: project.id,
      projectNumber: project.project_number,
      projectName: project.project_name,
      projectLocation: project.project_location ?? null,
      status: project.status ?? null,
      contractType: project.contract_type ?? null,
      parentProject: project.parent_project ?? null,
    },
    members: mapProjectMembers(project.project_users),
    metrics,
    reviews: reviewSummaries,
    issues: issueSummaries,
    insights,
    lastUpdated,
    settings,
    allReviewDocuments: reviews.flatMap(r => r.documents.map(d => ({
      id: d.id,
      name: d.documentName,
      code: d.documentCode ?? null
    }))),
  }
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("projects")
      .select("*, reviews(*, documents(*), issues(*)), project_milestones(*), project_statuses(*), project_importances(*), project_disciplines(*), project_states(*), project_suitabilities(*), project_review_stages(*), project_response_roles(*), project_users(*, user:users(*), roles:roles(*)), project_packages(*), project_classifications(*)")
      .order("project_name")

    if (error) {
      throw new Error(error.message)
    }

    const records = Array.isArray(data) ? (data as unknown as ProjectWithRelations[]) : []
    return records.map(mapProjectSummary)
  } catch (error) {
    throw new Error(
      `Failed to fetch projects: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export async function getProjectSummaryById(projectId: string): Promise<ProjectSummary | undefined> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("projects")
      .select("*, reviews(*, documents(*), issues(*)), project_milestones(*), project_statuses(*), project_importances(*), project_disciplines(*), project_states(*), project_suitabilities(*), project_review_stages(*), project_response_roles(*), project_users(*, user:users(*), roles:roles(*)), project_packages(*), project_classifications(*)")
      .eq("id", projectId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      return undefined
    }

    return mapProjectSummary(data as unknown as ProjectWithRelations)
  } catch (error) {
    throw new Error(
      `Failed to fetch project ${projectId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export async function getProjectSettings(projectId: string) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await (supabase as any)
      .from("projects")
      .select("settings")
      .eq("id", projectId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      return undefined
    }

    return data.settings
  } catch (error) {
    throw new Error(
      `Failed to fetch settings for project ${projectId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export async function getProjectExtractionSetups(projectId: string) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await (supabase as any)
      .from("projects")
      .select("settings->extraction_setups")
      .eq("id", projectId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!data) {
      return undefined
    }

    const extractionSetups = data.extraction_setups
    if (!extractionSetups) {
      return []
    }

    // Need to import ExtractionSetup if not available, but let's assume it's available or cast to any for now
    // Based on previous views, ExtractionSetup is used in the return type
    return Array.isArray(extractionSetups) ? extractionSetups : []
  } catch (error) {
    throw new Error(
      `Failed to fetch project extraction setups ${projectId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}


export async function updateProjectSettings(projectId: string, settings: ProjectSettings): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()

    // Using a simple sequential strategy for syncing normalized tables.
    // In a production app, this would ideally use a database transaction or a stored procedure.

    // 1. Update single-value settings in the projects table
    // Fetch current settings first to avoid overwriting fields we're not touching (like extraction_setups)
    const { data: currentProject } = await (supabase as any)
      .from("projects")
      .select("settings")
      .eq("id", projectId)
      .single()

    const currentSettings = currentProject?.settings || {}

    const { error: projectError } = await (supabase as any)
      .from("projects")
      .update({
        settings: {
          ...currentSettings,
          documentNamingConvention: settings.documentNamingConvention,
          documentCodeLocation: settings.documentCodeLocation,
          titleblockTemplateUrl: settings.titleblockTemplateUrl
        }
      })
      .eq("id", projectId)

    if (projectError) throw new Error(projectError.message)

    // Milestones, Statuses, Importances, Disciplines, and States are now managed 
    // via the IssueFieldsSettings component which performs granular CRUD operations.
    // We no longer sync them here to prevent accidental overwrites or ID replacement.

    // 7. Sync Suitabilities
    const { error: delSuitabilitiesErr } = await (supabase as any).from("project_suitabilities").delete().eq("project_id", projectId)
    if (delSuitabilitiesErr) throw new Error(delSuitabilitiesErr.message)

    if (settings.suitabilities.length) {
      const { error: insSuitabilitiesErr } = await (supabase as any).from("project_suitabilities").insert(
        settings.suitabilities.map(name => ({ project_id: projectId, name }))
      )
      if (insSuitabilitiesErr) throw new Error(insSuitabilitiesErr.message)
    }

    // 8. Sync Review Stages
    const { error: delStagesErr } = await (supabase as any).from("project_review_stages").delete().eq("project_id", projectId)
    if (delStagesErr) throw new Error(delStagesErr.message)

    if (settings.defaultReviewTimes.length) {
      const { error: insStagesErr } = await (supabase as any).from("project_review_stages").insert(
        settings.defaultReviewTimes.map(s => ({
          project_id: projectId,
          stage_name: s.stage,
          days: s.days
        }))
      )
      if (insStagesErr) throw new Error(insStagesErr.message)
    }

    // 9. Sync Response Roles
    const { error: delRolesErr } = await (supabase as any).from("project_response_roles").delete().eq("project_id", projectId)
    if (delRolesErr) throw new Error(delRolesErr.message)

    if (settings.defaultResponsePeriods.length) {
      const { error: insRolesErr } = await (supabase as any).from("project_response_roles").insert(
        settings.defaultResponsePeriods.map(r => ({
          project_id: projectId,
          role_name: r.role,
          days: r.days
        }))
      )
      if (insRolesErr) throw new Error(insRolesErr.message)
    }

  } catch (error) {
    throw new Error(
      `Failed to update settings for project ${projectId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export async function updateProjectMilestones(projectId: string, availableMilestones: Milestone[], selectedMilestones: string[]): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()

    // Sync Milestones
    const { error: delMilestonesErr } = await (supabase as any).from("project_milestones").delete().eq("project_id", projectId)
    if (delMilestonesErr) throw new Error(delMilestonesErr.message)

    if (availableMilestones.length) {
      const { error: insMilestonesErr } = await (supabase as any).from("project_milestones").insert(
        availableMilestones.map(m => ({
          project_id: projectId,
          name: m.name,
          description: m.description,
          is_selected: selectedMilestones.includes(m.name)
        }))
      )
      if (insMilestonesErr) throw new Error(insMilestonesErr.message)
    }

  } catch (error) {
    throw new Error(
      `Failed to update milestones for project ${projectId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}
