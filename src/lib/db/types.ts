export type Project = {
  id: string
  project_number: string
  project_name: string
  project_location: string | null
  status: string | null
  parent_project: string | null
  contract_type: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type Review = {
  id: string
  review_name: string
  review_number: string
  milestone: string | null
  due_date_sme_review: string | null
  due_date_issue_comments: string | null
  due_date_replies: string | null
  project_id: string
  status?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type Document = {
  id: string
  document_name: string
  document_code: string | null
  state: string | null
  milestone: string | null
  suitability: string | null
  version: string | null
  revision: string | null
  pdf_url: string | null
  review_id: string
  project_id: string
  file_size?: string | null
  uploaded_at?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type Issue = {
  id: string
  issue_number: string
  date_created: string | null
  date_modified: string | null
  created_by_user_id: string | null
  modified_by_user_id: string | null
  comment: string | null
  discipline: string | null
  importance: string | null
  document_id: string | null
  review_id: string
  project_id: string
  comment_coordinates: string | null
  page_number: number | null
  ifc_element_id: string | null
  status: string | null
  age_days?: number | null
  is_high_priority?: boolean | null
  is_long_open?: boolean | null
}

export type User = {
  id: string
  first_name: string
  last_name: string
  language: string | null
  email: string
  job_title: string | null
}

export type ReviewUser = {
  id: string
  review_id: string
  user_id: string
  role: string | null
}

export type Database = {
  redlines: {
    Tables: {
      projects: {
        Row: Project
      }
      reviews: {
        Row: Review
      }
      documents: {
        Row: Document
      }
      issues: {
        Row: Issue
      }
      users: {
        Row: User
      }
      review_users: {
        Row: ReviewUser
      }
    }
  }
}


