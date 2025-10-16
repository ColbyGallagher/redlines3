import { unstable_cache } from "next/cache"

import { createServerSupabaseClientFromHeaders as createServerSupabaseClient } from "@/lib/supabase/server"
import type {
  Database,
  Document,
  Issue,
  Project,
  Review,
  User,
} from "@/lib/db/types"

type CachedQuery<TArgs extends any[], TResult> = (...args: TArgs) => Promise<TResult>

const cached = <TArgs extends any[], TResult>(key: string[], fn: CachedQuery<TArgs, TResult>) =>
  unstable_cache(fn, key, { tags: key })

export type ProjectSummary = {
  project: Project
  reviews: Array<Review & { documents: Document[]; issues: Issue[] }>
}

export const getProjects = cached(["projects"] as const, async () => {
  const supabase = await createServerSupabaseClient<Database>()
  const { data, error } = await supabase.from("projects").select("*").order("project_name")
  if (error) throw error
  return data
})

export const getProjectById = async (id: string) => {
  const supabase = await createServerSupabaseClient<Database>()
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).maybeSingle()
  if (error) throw error
  return data
}

export const getProjectWithRelations = async (id: string): Promise<ProjectSummary | null> => {
  const supabase = await createServerSupabaseClient<Database>()

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

  return {
    project,
    reviews: reviews ?? [],
  }
}

export const getReviewById = async (id: string) => {
  const supabase = await createServerSupabaseClient<Database>()
  const { data, error } = await supabase
    .from("reviews")
    .select("*, project:projects(*), documents(*), issues(*), review_users(*, user:users(*))")
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  return data
}

export const getDocumentById = async (reviewId: string, documentId: string) => {
  const supabase = await createServerSupabaseClient<Database>()
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
  const supabase = await createServerSupabaseClient<Database>()
  const { data, error } = await supabase.from("users").select("*")
  if (error) throw error
  return data
}


