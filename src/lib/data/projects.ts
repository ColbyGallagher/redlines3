import "server-only"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/db/types"

const MS_PER_DAY = 1000 * 60 * 60 * 24
const UPCOMING_REVIEW_WINDOW_DAYS = 7
const LONG_OPEN_ISSUE_DAYS = 14

const ACTIVE_REVIEW_STATUSES = new Set(["Draft", "In Review", "Awaiting Client", "Flagged"])
const ACTIVE_ISSUE_STATUSES = new Set(["Open", "In Progress"])
const CLOSED_ISSUE_STATUS = "Closed"

type ProjectRow = Database["redlines"]["Tables"]["projects"]["Row"]
type ReviewRow = Database["redlines"]["Tables"]["reviews"]["Row"]
type DocumentRow = Database["redlines"]["Tables"]["documents"]["Row"]
type IssueRow = Database["redlines"]["Tables"]["issues"]["Row"]

type ReviewWithRelations = ReviewRow & {
  documents: DocumentRow[] | null
  issues: IssueRow[] | null
}

type ProjectWithRelations = ProjectRow & {
  reviews: ReviewWithRelations[] | null
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

export type ProjectSettings = {
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
  metrics: ProjectMetrics
  reviews: ProjectReviewSummary[]
  issues: ProjectIssueSummary[]
  insights: ProjectInsight[]
  lastUpdated: string
  settings: ProjectSettings
}

type PrimaryDueDateType = "client" | "consultant" | "reply"

type PrimaryDueDate = {
  date: Date
  type: PrimaryDueDateType
}

function mapReview(row: ReviewWithRelations, project: ProjectRow): NormalizedReview {
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
    issues: (row.issues ?? []).map((issue) => ({
      id: issue.id,
      issueNumber: issue.issue_number,
      status: issue.status ?? "Open",
      importance: issue.importance ?? "Medium",
      discipline: issue.discipline ?? "General",
      dateCreated: issue.date_created ?? null,
      dateModified: issue.date_modified ?? issue.date_created ?? null,
      documentId: issue.document_id ?? null,
      reviewId: issue.review_id,
      projectId: issue.project_id,
      comment: issue.comment ?? null,
      commentCoordinates: issue.comment_coordinates ?? null,
      pageNumber: issue.page_number ?? null,
    })),
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

function calculateReviewSummaries(today: Date, reviews: NormalizedReview[]): ProjectReviewSummary[] {
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
      status: review.status,
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

function deriveSettings(reviews: ProjectReviewSummary[], issues: ProjectIssueSummary[]): ProjectSettings {
  const statuses = Array.from(new Set(reviews.map((review) => review.status))).filter(Boolean)
  const importances = Array.from(new Set(issues.map((issue) => issue.importance))).filter(Boolean)
  const disciplines = Array.from(new Set(issues.map((issue) => issue.discipline))).filter(Boolean)

  const availableMilestones = Array.from(new Set(reviews.map((review) => review.milestone))).filter(Boolean)
  const selectedMilestones = Array.from(
    new Set(
      reviews
        .filter((review) => ACTIVE_REVIEW_STATUSES.has(review.status))
        .map((review) => review.milestone),
    ),
  ).filter(Boolean)

  return {
    availableMilestones,
    selectedMilestones,
    titleblockTemplateUrl: undefined,
    documentNamingConvention: "<project>-<discipline>-<drawingNumber>-<revision>",
    documentCodeLocation: "Top right corner",
    statuses: statuses.length ? statuses : ["Draft", "In Review", "Awaiting Client", "Approved", "Flagged"],
    importances: importances.length ? importances : ["Low", "Medium", "High"],
    disciplines: disciplines.length
      ? disciplines
      : ["Architectural", "Mechanical", "Electrical", "Structural", "Interior"],
    states: ["For Review", "For Approval", "For Construction", "As Built"],
    suitabilities: ["S1 - Suitable for coordination", "S2 - Suitable for information", "S3 - Suitable for coordination"],
    defaultReviewTimes: [
      { stage: "Client SME", days: 5 },
      { stage: "Consultant", days: 7 },
    ],
    defaultResponsePeriods: [
      { role: "Design Team", days: 10 },
      { role: "Client", days: 15 },
    ],
  }
}

function computeLastUpdated(normalizedReviews: NormalizedReview[]): string {
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
    return new Date(0).toISOString()
  }

  return new Date(Math.max(...timestamps)).toISOString()
}

function mapProjectSummary(project: ProjectWithRelations): ProjectSummary {
  const reviews = (project.reviews ?? []).map((review) => mapReview(review, project))
  const today = new Date()

  const reviewSummaries = calculateReviewSummaries(today, reviews)
  const issueSummaries = calculateIssueSummaries(today, reviews)
  const metrics = calculateMetrics(reviewSummaries, issueSummaries)
  const insights = buildInsights(project.id, reviewSummaries, issueSummaries)
  const lastUpdated = computeLastUpdated(reviews)
  const settings = deriveSettings(reviewSummaries, issueSummaries)

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
    metrics,
    reviews: reviewSummaries,
    issues: issueSummaries,
    insights,
    lastUpdated,
    settings,
  }
}

export async function getProjectSummaries(): Promise<ProjectSummary[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from("projects")
      .select("*, reviews(*, documents(*), issues(*))")
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
      .select("*, reviews(*, documents(*), issues(*))")
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


