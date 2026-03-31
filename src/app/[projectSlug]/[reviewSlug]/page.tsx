import { notFound } from "next/navigation"

import { ReviewDetailsView } from "@/components/reviews/review-details-view"
import { getReviewDetailBySlug } from "@/lib/data/reviews"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { ActiveProjectTracker } from "@/components/projects/active-project-tracker"

type ReviewPageProps = {
  params: Promise<{ projectSlug: string, reviewSlug: string }>
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { projectSlug, reviewSlug } = await params
  const review = await getReviewDetailBySlug(reviewSlug)

  if (!review || review.project.slug !== projectSlug) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold">Review not found or access restricted</h1>
        <p className="text-muted-foreground">You may not have permission to view this review.</p>
        <Button asChild>
          <a href="/projects">Go to Projects</a>
        </Button>
      </div>
    )
  }

  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // 1. Check direct project role (more reliable than review-level role)
  const { data: projectMember } = await (supabase.from("project_users") as any)
    .select("role")
    .eq("project_id", review.project.id)
    .eq("user_id", user?.id)
    .maybeSingle()

  const projectRole = (projectMember as any)?.role?.toLowerCase()
  const hasProjectPermission = projectRole === "admin" || projectRole === "developer"
  
  // 2. Also check global roles if not already permitted
  let canEditLifecycle = !!hasProjectPermission
  if (!canEditLifecycle && user) {
    const { data: orgRoles } = await (supabase.from("user_companies") as any)
        .select(`roles:role_id (name)`)
        .eq("user_id", user.id)
        .eq("active", true)
    
    const globalRoles = (orgRoles || []).map((uc: any) => uc.roles?.name?.toLowerCase()).filter(Boolean)
    canEditLifecycle = globalRoles.includes('org admin') || globalRoles.includes('admin') || globalRoles.includes('developer')
  }

  const isAdmin = canEditLifecycle

  // 3. Fetch project members and their roles for the Add Reviewer dialog
  const { data: projectMemberData } = await (supabase.from("project_users") as any)
    .select("user_id, role")
    .eq("project_id", review.project.id)
  
  const projectMemberRoles = (projectMemberData || []).reduce((acc: Record<string, string>, curr: any) => {
    acc[curr.user_id] = curr.role
    return acc
  }, {})

  // 4. Fetch project milestones for inline editing
  const { data: milestoneData } = await (supabase.from("project_milestones") as any)
    .select("name")
    .eq("project_id", review.project.id)
    .order("name")
  
  const availableMilestones = (milestoneData || []).map((m: any) => m.name)

  return (
    <>
      <ActiveProjectTracker projectId={review.project.id} />
      <ReviewDetailsView 
        review={review} 
        isAdmin={isAdmin} 
        availableMilestones={availableMilestones} 
        projectMemberRoles={projectMemberRoles}
      />
    </>
  )
}
