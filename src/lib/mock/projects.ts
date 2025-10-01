import { reviewDetails, type ReviewDetail, type ReviewIssue } from "@/lib/mock/review-details"

const MS_PER_DAY = 1000 * 60 * 60 * 24
const UPCOMING_REVIEW_WINDOW_DAYS = 7
const LONG_OPEN_ISSUE_DAYS = 14

const ACTIVE_REVIEW_STATUSES = new Set<ReviewDetail["status"]>(["Draft", "In Review", "Awaiting Client", "Flagged"])
const ACTIVE_ISSUE_STATUSES = new Set<ReviewIssue["status"]>(["Open", "In Progress"])
const CLOSED_ISSUE_STATUS: ReviewIssue["status"] = "Closed"

type PrimaryDueDateType = "client" | "consultant" | "reply"

type PrimaryDueDate = {
  date: Date
  type: PrimaryDueDateType
}

export type ProjectReviewSummary = {
  id: string
  reviewName: string
  milestone: string
  status: ReviewDetail["status"]
  dueDate?: string
  dueDateType?: PrimaryDueDateType
  daysUntilDue?: number
  isOverdue: boolean
  isUpcoming: boolean
}

export type ProjectIssueSummary = {
  id: string
  issueNumber: string
  status: ReviewIssue["status"]
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

export type ProjectSummary = {
  project: ReviewDetail["project"]
  metrics: ProjectMetrics
  reviews: ProjectReviewSummary[]
  issues: ProjectIssueSummary[]
  insights: ProjectInsight[]
  lastUpdated: string
  settings: {
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
    defaultReviewTimes: {
      stage: string
      days: number
    }[]
    defaultResponsePeriods: {
      role: string
      days: number
    }[]
  }
}

type ProjectAccumulator = {
  project: ReviewDetail["project"]
  reviews: ReviewDetail[]
  issues: ReviewIssue[]
}

function parseDate(value: string | undefined | null): Date | undefined {
  if (!value) {
    return undefined
  }

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function getPrimaryDueDate(review: ReviewDetail): PrimaryDueDate | undefined {
  const dueDates: Array<{ date?: Date; type: PrimaryDueDateType }> = [
    { date: parseDate(review.dueDateClientSmeComments), type: "client" },
    { date: parseDate(review.dueDateIssueCommentsConsultant), type: "consultant" },
    { date: parseDate(review.dueDateIssueRepliesClient), type: "reply" },
  ]

  const validDates = dueDates.filter((entry): entry is { date: Date; type: PrimaryDueDateType } => Boolean(entry.date))

  if (!validDates.length) {
    return undefined
  }

  validDates.sort((a, b) => a.date.getTime() - b.date.getTime())

  return validDates[0]
}

function calculateReviewSummaries(today: Date, reviews: ReviewDetail[]): ProjectReviewSummary[] {
  return reviews.map((review) => {
    const primaryDueDate = getPrimaryDueDate(review)
    const dueDate = primaryDueDate?.date
    const dueDateIso = dueDate?.toISOString()

    const daysUntilDue = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / MS_PER_DAY) : undefined
    const isActive = ACTIVE_REVIEW_STATUSES.has(review.status)
    const isOverdue = Boolean(dueDate) && isActive && (dueDate as Date).getTime() < today.getTime()
    const isUpcoming = Boolean(daysUntilDue !== undefined && daysUntilDue >= 0 && daysUntilDue <= UPCOMING_REVIEW_WINDOW_DAYS && isActive)

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

function calculateIssueSummaries(today: Date, issues: ReviewIssue[]): ProjectIssueSummary[] {
  return issues.map((issue) => {
    const createdAt = parseDate(issue.dateCreated)
    const ageDays = createdAt ? Math.max(0, Math.floor((today.getTime() - createdAt.getTime()) / MS_PER_DAY)) : 0
    const isActive = ACTIVE_ISSUE_STATUSES.has(issue.status)
    const isHighPriority = issue.importance.toLowerCase() === "high"
    const isLongOpen = isActive && ageDays >= LONG_OPEN_ISSUE_DAYS

    return {
      id: issue.id,
      issueNumber: issue.issueNumber,
      status: issue.status,
      importance: issue.importance,
      discipline: issue.discipline,
      dateCreated: issue.dateCreated,
      dateModified: issue.dateModified,
      ageDays,
      isHighPriority,
      isLongOpen,
      reviewId: issue.reviewId,
    }
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

function deriveProjectSummaries(): ProjectSummary[] {
  const today = new Date()
  const projectMap = new Map<string, ProjectAccumulator>()

  for (const review of reviewDetails) {
    const { project } = review
    const entry = projectMap.get(project.id)

    if (!entry) {
      projectMap.set(project.id, {
        project,
        reviews: [review],
        issues: [...review.issues],
      })
    } else {
      entry.reviews.push(review)
      entry.issues.push(...review.issues)
    }
  }

  return Array.from(projectMap.values()).map(({ project, reviews, issues }) => {
    const reviewSummaries = calculateReviewSummaries(today, reviews)
    const issueSummaries = calculateIssueSummaries(today, issues)
    const metrics = calculateMetrics(reviewSummaries, issueSummaries)
    const insights = buildInsights(project.id, reviewSummaries, issueSummaries)

    const latestReviewUpdate = reviews
      .map((review) => parseDate(review.lastUpdated))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    const latestIssueUpdate = issues
      .map((issue) => parseDate(issue.dateModified))
      .filter((date): date is Date => Boolean(date))
      .sort((a, b) => b.getTime() - a.getTime())[0]

    const latestUpdateTimestamp = Math.max(
      latestReviewUpdate?.getTime() ?? 0,
      latestIssueUpdate?.getTime() ?? 0,
    )

    return {
      project,
      metrics,
      reviews: reviewSummaries,
      issues: issueSummaries,
      insights,
      lastUpdated: latestUpdateTimestamp ? new Date(latestUpdateTimestamp).toISOString() : new Date(0).toISOString(),
      settings: {
        availableMilestones: Array.from(
          new Set(reviews.map((review) => review.milestone))
        ),
        selectedMilestones: Array.from(
          new Set(
            reviews
              .filter((review) => ACTIVE_REVIEW_STATUSES.has(review.status))
              .map((review) => review.milestone)
          )
        ),
        titleblockTemplateUrl: undefined,
        documentNamingConvention: "<project>-<discipline>-<drawingNumber>-<revision>",
        documentCodeLocation: "Top right corner",
        statuses: ["Draft", "In Review", "Awaiting Client", "Approved", "Flagged"],
        importances: ["Low", "Medium", "High"],
        disciplines: [
          "Architectural",
          "Mechanical",
          "Electrical",
          "Structural",
          "Interior",
        ],
        states: [
          "For Review",
          "For Approval",
          "For Construction",
          "As Built",
        ],
        suitabilities: [
          "S1 - Suitable for coordination",
          "S2 - Suitable for information",
          "S3 - Suitable for coordination",
        ],
        defaultReviewTimes: [
          { stage: "Client SME", days: 5 },
          { stage: "Consultant", days: 7 },
        ],
        defaultResponsePeriods: [
          { role: "Design Team", days: 10 },
          { role: "Client", days: 15 },
        ],
      },
    }
  })
}

const projectSummaries = deriveProjectSummaries().sort((a, b) =>
  a.project.projectName.localeCompare(b.project.projectName),
)

export function getProjectSummaries(): ProjectSummary[] {
  return projectSummaries
}

export function getProjectSummaryById(projectId: string): ProjectSummary | undefined {
  return projectSummaries.find((summary) => summary.project.id === projectId)
}

export function getProjectSummaryByNumber(projectNumber: string): ProjectSummary | undefined {
  return projectSummaries.find((summary) => summary.project.projectNumber === projectNumber)
}

