export type ExtractionArea = {
  x: number
  y: number
  width: number
  height: number
}

export type ExtractionSettings = {
  documentCode?: ExtractionArea
  documentName?: ExtractionArea
  revision?: ExtractionArea
}

export type ExtractionSetup = {
  id: string
  name: string
  settings: ExtractionSettings
}
export type ProjectSettings = {
  importances?: string[] | null
  disciplines?: string[] | null
  extraction_settings?: ExtractionSettings | null
  extraction_setups?: ExtractionSetup[] | null
  companies?: string[] | null
}

type GenericRelationship = {
  foreignKeyName: string
  columns: string[]
  isOneToOne?: boolean
  referencedRelation: string
  referencedColumns: string[]
}


export type Project = {
  id: string
  slug: string
  project_number: string
  project_name: string
  project_location: string | null
  status: string | null
  parent_project: string | null
  contract_type: string | null
  company_id: string | null
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  settings: ProjectSettings | null
  created_at?: string | null
  updated_at?: string | null
}

export type Review = {
  id: string
  slug: string
  review_name: string
  review_number: string
  milestone: string | null
  due_date_sme_review: string | null
  due_date_issue_comments: string | null
  due_date_replies: string | null
  project_id: string
  state?: ReviewState | null
  specific_status?: ReviewStatus | null
  phase_id?: string | null
  status?: string | null
  summary?: string | null
  start_date?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ProjectWorkflow = {
  id: string
  project_id: string
  name: string
  description?: string
  created_at?: string | null
  updated_at?: string | null
}

export type ProjectReviewPhase = {
  id: string
  project_id: string
  workflow_id?: string
  phase_name: string
  duration_days: number
  order_index: number
  allowed_roles: string[]
  permissions: {
    roles: Record<string, string[]>
    companies: string[]
  }
  state: "Active" | "Complete" | "Archived"
  created_at?: string | null
  updated_at?: string | null
}

export type ReviewPhase = {
  id: string
  review_id: string
  name: string
  due_date: string | null
  status: string | null
  created_at?: string | null
  updated_at?: string | null
}

export type ReviewState = "Active" | "Complete" | "Archived"
export type ReviewStatus = "Awaiting Design Review" | "Awaiting Client Review" | "In Progress" | "Resolved" | "Closed" | string

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
  parent_id?: string | null
  page_number?: number | null
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
  discipline_old?: string | null
  importance: string | null
  importance_old?: string | null
  document_id: string | null
  review_id: string
  project_id: string
  comment_coordinates: string | null
  page_number: number | null
  ifc_element_id: string | null
  status: string | null
  status_old?: string | null
  snapshot_path?: string | null
  age_days?: number | null
  is_high_priority?: boolean | null
  is_long_open?: boolean | null
  milestone?: string | null
  state?: string | null
  package?: string | null
  document_number?: string | null
  document_title?: string | null
  reviewers_name?: string | null
  classification?: string | null
}

export type ProjectMilestone = {
  id: string
  project_id: string
  name: string
  description: string | null
  is_selected: boolean
}

export type ProjectStatus = {
  id: string
  project_id: string
  name: string
}

export type ProjectImportance = {
  id: string
  project_id: string
  name: string
}

export type ProjectDiscipline = {
  id: string
  project_id: string
  name: string
}

export type ProjectState = {
  id: string
  project_id: string
  name: string
  order_index: number
  allowed_roles: string[]
}

export type ProjectSuitability = {
  id: string
  project_id: string
  name: string
}

export type ProjectPackage = {
  id: string
  project_id: string
  name: string
}

export type ProjectClassification = {
  id: string
  project_id: string
  name: string
}


export type ProjectResponseRole = {
  id: string
  project_id: string
  role_name: string
  days: number
}

export type Company = {
  id: string
  name: string
  company_code: string | null
}

export type User = {
  id: string
  first_name: string
  last_name: string
  language: string | null
  email: string
  job_title: string | null
}

export type Role = {
  id: string
  name: string
  company_id: string | null
}

export type UserCompany = {
  id: string
  user_id: string
  company_id: string
  role_id: string | null
  active: boolean
}

export type ReviewUser = {
  id: string
  review_id: string
  user_id: string
  role: string | null
  user_name: string | null
  company_name: string | null
  started_at?: string | null
  completed_at?: string | null
}

export type ProjectUser = {
  id: string
  project_id: string
  user_id: string
  role: string | null
  role_id: string | null
  user_name: string | null
  company_name: string | null
}

export type ProjectReferenceDocument = {
  id: string
  project_id: string
  file_name: string
  file_size: number
  content_type: string
  storage_path: string
  uploaded_by: string
  created_at: string | null
}

type TableDefinition<T> = {
  Row: T
  Insert: {
    [K in keyof T]?: T[K] | null
  }
  Update: {
    [K in keyof T]?: T[K] | null
  }
  Relationships: GenericRelationship[]
}

export type Database = {
  public: {
    Tables: {
      projects: TableDefinition<Project>
      reviews: TableDefinition<Review>
      documents: TableDefinition<Document>
      issues: TableDefinition<Issue>
      project_milestones: TableDefinition<ProjectMilestone>
      project_statuses: TableDefinition<ProjectStatus>
      project_importances: TableDefinition<ProjectImportance>
      project_disciplines: TableDefinition<ProjectDiscipline>
      project_states: TableDefinition<ProjectState>
      project_suitabilities: TableDefinition<ProjectSuitability>
      project_response_roles: TableDefinition<ProjectResponseRole>
      users: TableDefinition<User>
      companies: TableDefinition<Company>
      roles: TableDefinition<Role>
      user_companies: TableDefinition<UserCompany>
      review_users: TableDefinition<ReviewUser>
      project_users: TableDefinition<ProjectUser>
      project_packages: TableDefinition<ProjectPackage>
      project_classifications: TableDefinition<ProjectClassification>
      project_review_phases: TableDefinition<ProjectReviewPhase>
      project_workflows: TableDefinition<ProjectWorkflow>
      project_reference_documents: TableDefinition<ProjectReferenceDocument>
      review_phases: TableDefinition<ReviewPhase>
      review_document_views: TableDefinition<{
        id: string
        review_id: string
        document_id: string
        user_id: string
        viewed_at: string
      }>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: never
  }
}


