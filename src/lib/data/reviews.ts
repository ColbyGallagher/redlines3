import "server-only"

import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/db/types"
import { formatName, toTitleCaseFallback } from "@/lib/utils/user-utils"

type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"]
type ProjectRow = Database["public"]["Tables"]["projects"]["Row"]
type DocumentRow = Database["public"]["Tables"]["documents"]["Row"]
type IssueRow = Database["public"]["Tables"]["issues"]["Row"]
type ReviewUserRow = Database["public"]["Tables"]["review_users"]["Row"] & {
  user: Database["public"]["Tables"]["users"]["Row"] | null
}

export type ReviewUser = {
  id: string
  firstName: string
  lastName: string
  email: string
  jobTitle: string
  role: string
  avatarFallback: string
  company?: string
  status?: string
}

export type ReviewDocument = {
  id: string
  documentName: string
  documentCode: string
  state: string
  milestone: string
  suitability: string
  version: string
  revision: string
  pdfUrl: string
  fileSize: string
  uploadedAt: string
}

export type ReviewIssue = {
  id: string
  issueNumber: string
  dateCreated: string
  dateModified: string
  createdByUserId: string
  modifiedByUserId: string
  comment: string
  discipline: string
  importance: string
  documentId: string
  reviewId: string
  projectId: string
  commentCoordinates: string
  pageNumber: number
  ifcElementId: string
  status: "Open" | "In Progress" | "Resolved" | "Closed"
}

export type ReviewDetail = {
  id: string
  reviewName: string
  reviewNumber: string
  milestone: string
  status: "Draft" | "In Review" | "Awaiting Client" | "Approved" | "Flagged"
  dueDateSmeReview: string
  dueDateIssueComments: string
  dueDateReplies: string
  project: {
    id: string
    projectNumber: string
    projectName: string
    projectLocation: string
  }
  reviewers: ReviewUser[]
  documents: ReviewDocument[]
  issues: ReviewIssue[]
  summary: string
  lastUpdated: string
}

export type ReviewSummary = {
  id: string
  reviewName: string
  reviewNumber: string
  milestone: string
  dueDate: string | null
  project: {
    id: string
    name: string
    number?: string
  } | null
  coordinator: string
  status: ReviewDetail["status"]
}

function mapReviewSummary(row: ReviewRow & { project: ProjectRow | null }): ReviewSummary {
  return {
    id: row.id,
    reviewName: row.review_name ?? "Untitled review",
    reviewNumber: row.review_number ?? "",
    milestone: row.milestone ?? "",
    dueDate: row.due_date_issue_comments ?? row.due_date_sme_review ?? null,
    project: row.project
      ? {
        id: row.project.id,
        name: row.project.project_name ?? "Untitled project",
        number: row.project.project_number ?? undefined,
      }
      : null,
    coordinator: "Unassigned",
    status: (row.status ?? "Draft") as ReviewDetail["status"],
  }
}

function mapProject(project: ProjectRow | null): ReviewDetail["project"] {
  return {
    id: project?.id ?? "",
    projectNumber: project?.project_number ?? "",
    projectName: project?.project_name ?? "Untitled project",
    projectLocation: project?.project_location ?? "",
  }
}


function mapReviewers(reviewUsers: ReviewUserRow[] | null | undefined): ReviewUser[] {
  if (!reviewUsers?.length) return []

  return reviewUsers.map((entry) => {
    const user = entry.user
    const firstName = formatName(user?.first_name)
    const lastName = formatName(user?.last_name)

    return {
      id: user?.id ?? entry.id,
      firstName,
      lastName,
      email: user?.email ?? "",
      jobTitle: formatName(user?.job_title),
      role: entry.role ?? "Reviewer",
      avatarFallback: toTitleCaseFallback(firstName, lastName),
      company: "ColbyGallagher",
      status: "Active",
    }
  })
}

function mapDocuments(documents: DocumentRow[] | null | undefined): ReviewDocument[] {
  if (!documents?.length) return []

  return documents.map((document) => ({
    id: document.id,
    documentName: document.document_name ?? "Untitled document",
    documentCode: document.document_code ?? "",
    state: document.state ?? "",
    milestone: document.milestone ?? "",
    suitability: document.suitability ?? "",
    version: document.version ?? "",
    revision: document.revision ?? "",
    pdfUrl: document.pdf_url ?? "",
    fileSize: document.file_size ?? "",
    uploadedAt: document.uploaded_at ?? "",
  }))
}

function mapIssues(issues: IssueRow[] | null | undefined): ReviewIssue[] {
  if (!issues?.length) return []

  return issues.map((issue) => ({
    id: issue.id,
    issueNumber: issue.issue_number ?? "",
    dateCreated: issue.date_created ?? "",
    dateModified: issue.date_modified ?? issue.date_created ?? "",
    createdByUserId: issue.created_by_user_id ?? "",
    modifiedByUserId: issue.modified_by_user_id ?? issue.created_by_user_id ?? "",
    comment: issue.comment ?? "",
    discipline: issue.discipline ?? "",
    importance: issue.importance ?? "",
    documentId: issue.document_id ?? "",
    reviewId: issue.review_id,
    projectId: issue.project_id,
    commentCoordinates: issue.comment_coordinates ?? "",
    pageNumber: issue.page_number ?? 0,
    ifcElementId: issue.ifc_element_id ?? "",
    status: (issue.status ?? "Open") as ReviewIssue["status"],
  }))
}

function mapReview(row: ReviewRow & {
  project: ProjectRow | null
  documents: DocumentRow[] | null
  issues: IssueRow[] | null
  review_users: ReviewUserRow[] | null
}): ReviewDetail {
  return {
    id: row.id,
    reviewName: row.review_name ?? "Untitled review",
    reviewNumber: row.review_number ?? "",
    milestone: row.milestone ?? "",
    status: (row.status ?? "Draft") as ReviewDetail["status"],
    dueDateSmeReview: row.due_date_sme_review ?? "",
    dueDateIssueComments: row.due_date_issue_comments ?? "",
    dueDateReplies: row.due_date_replies ?? "",
    project: mapProject(row.project),
    reviewers: mapReviewers(row.review_users ?? []),
    documents: mapDocuments(row.documents ?? []),
    issues: mapIssues(row.issues ?? []),
    summary: row.summary ?? "No summary available yet.",
    lastUpdated: row.updated_at ?? row.created_at ?? new Date(0).toISOString(),
  }
}

export async function getReviewSummaries(): Promise<ReviewSummary[]> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("reviews")
      .select("*, project:projects(id, project_name, project_number)")
      .order("review_name")

    if (error) {
      throw new Error(error.message)
    }

    const rows = Array.isArray(data) ? (data as unknown as (ReviewRow & { project: ProjectRow | null })[]) : []
    return rows.map(mapReviewSummary)
  } catch (error) {
    throw new Error(
      `Failed to fetch review summaries: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export async function getReviewDetailById(reviewId: string): Promise<ReviewDetail | undefined> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("reviews")
      .select(
        "*, project:projects(*), documents(*), issues(*), review_users(*, user:users(*))",
      )
      .eq("id", reviewId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!data || typeof data !== "object") {
      return undefined
    }

    const record = data as unknown as ReviewRow & {
      project: ProjectRow | null
      documents: DocumentRow[] | null
      issues: IssueRow[] | null
      review_users: ReviewUserRow[] | null
    }

    return mapReview(record)
  } catch (error) {
    throw new Error(
      `Failed to fetch review ${reviewId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    )
  }
}

export async function getDocumentForReview(reviewId: string, documentId: string): Promise<ReviewDocument | undefined> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("review_id", reviewId)
      .eq("id", documentId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    if (!data || typeof data !== "object") {
      return undefined
    }

    const record = data as unknown as DocumentRow
    const [document] = mapDocuments([record])

    // Generate signed URL for PDF if it exists
    if (record.pdf_url) {
      try {
        const urlParts = record.pdf_url.split("/storage/v1/object/public/")
        if (urlParts.length > 1) {
          const pathParts = urlParts[1].split("/")
          const bucket = pathParts[0]
          const path = pathParts.slice(1).join("/")

          const { data: signedData, error: signedError } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, 3600)

          if (!signedError && signedData) {
            document.pdfUrl = signedData.signedUrl
          }
        }
      } catch (e) {
        console.error("Failed to generate signed URL", e)
      }
    }

    return document
  } catch (error) {
    throw new Error(
      `Failed to fetch document ${documentId} for review ${reviewId}: ${error instanceof Error ? error.message : "Unknown error"
      }`,
    )
  }
}

export async function getAnnotationsForDocument(documentId: string) {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from("annotations")
      .select("*")
      .eq("document_id", documentId)
      .order("created_at", { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return (data || []).map((record: any) => ({
      id: record.id,
      reviewId: record.review_id,
      documentId: record.document_id,
      page: record.page,
      x: record.x,
      y: record.y,
      content: record.content,
      color: record.color,
      classification: record.classification,
      priority: record.priority,
      type: record.type,
      issueId: record.issue_id,
      createdBy: record.created_by,
      createdAt: record.created_at,
    }))
  } catch (error) {
    console.error("Failed to fetch annotations on server", error)
    return []
  }
} 
