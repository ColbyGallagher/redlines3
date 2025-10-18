import { unstable_cache } from "next/cache"

import { createServerSupabaseClientFromHeaders as createServerSupabaseClient } from "@/lib/supabase/server"
import type {
    Document,
  Issue,
  Project,
  Review,
  User,
} from "@/lib/db/types"

type CachedQuery<TArgs extends unknown[], TResult> = (...args: TArgs) => Promise<TResult>

const cached = <TArgs extends unknown[], TResult>(key: string[], fn: CachedQuery<TArgs, TResult>) =>
  unstable_cache(fn, key, { tags: key })

const toArray = <T>(value: unknown): T[] =>
  Array.isArray(value) ? (value as unknown as T[]) : []

const toRecord = <T>(value: unknown): T | null =>
  value && typeof value === "object" ? (value as unknown as T) : null

export type ProjectSummary = {
  project: Project
  reviews: Array<Review & { documents: Document[]; issues: Issue[] }>
}

export const getProjects = cached(["projects"] as const, async () => {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("projects").select("*").order("project_name")
  if (error) throw error
  return toArray<Project>(data)
})

export const getProjectById = async (id: string) => {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle()
  if (error) throw error
  return toRecord<Project>(data)
}

export const getProjectWithRelations = async (id: string): Promise<ProjectSummary | null> => {
  const supabase = await createServerSupabaseClient()

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (projectError) throw projectError
  if (!project) return null

  const { data: reviews, error: reviewError } = await supabase
    .from("reviews")
      .select("*, documents(*), issues(*)")
    .eq("project_id", id)

  if (reviewError) throw reviewError

  const normalizedProject = toRecord<Project>(project)
  if (!normalizedProject) {
    throw new Error(`Unexpected project payload for id ${id}`)
  }
  const normalizedReviews = toArray<Review & { documents: Document[]; issues: Issue[] }>(reviews)

  return {
    project: normalizedProject,
    reviews: normalizedReviews,
  }
}

export const getReviewById = async (id: string) => {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("reviews")
    .select("*, project:projects(*), documents(*), issues(*), review_users(*, user:users(*))")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getDocumentById = async (reviewId: string, documentId: string) => {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("review_id", reviewId)
    .eq("id", documentId)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getUsers = async (): Promise<User[]> => {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.from("users").select("*")
  if (error) throw error
  return toArray<User>(data)
}


