import { redirect } from "next/navigation"
import Link from "next/link"
import { Settings2, Trash2 } from "lucide-react"

import { InsightCallouts } from "@/components/projects/insight-callouts"
import { IssuesTable } from "@/components/projects/issues-table"
import { ProjectReviewsList } from "@/components/projects/project-reviews-list"
import { ProjectSummaryHeader } from "@/components/projects/project-summary-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { AddProjectMemberDialog } from "@/components/projects/add-project-member-dialog"
import { MemberActions } from "@/components/projects/member-actions"
import { AccessDenied } from "@/components/projects/access-denied"
import { getProjectSummaryById } from "@/lib/data/projects"
import { getRoles } from "@/lib/actions/users"

type ProjectDashboardPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    created?: string
  }>
}

export default async function ProjectDashboardPage({ params, searchParams }: ProjectDashboardPageProps) {
  const { id } = await params
  const { created } = await searchParams

  const summary = await getProjectSummaryById(id)

  if (!summary) {
    return <AccessDenied projectId={id} />
  }

  const roles = await getRoles()

  const showSuccessMessage = created === "1"
  const successBannerMessage = showSuccessMessage
    ? `Project “${summary.project.projectName}” created successfully.`
    : undefined

  return (
    <div className="flex flex-1 flex-col">
      <ProjectSummaryHeader
        summary={summary}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/projects/${id}/settings`}>
              <Settings2 className="size-4" />
              <span>Project settings</span>
            </Link>
          </Button>
        }
        successMessage={successBannerMessage}
      />
      <main className="flex flex-1 flex-col gap-6 p-6 pt-4">
        <InsightCallouts insights={summary.insights} />
        <section className="grid gap-4 lg:grid-cols-12">
          <ProjectReviewsList summary={summary} />
          <IssuesTable issues={summary.issues} summary={summary} />
        </section>

        <section className="grid gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div className="space-y-1">
                <CardTitle>Project team</CardTitle>
                <CardDescription>People contributing to this project</CardDescription>
              </div>
              <AddProjectMemberDialog
                projectId={summary.project.id}
                existingMemberIds={summary.members.map(m => m.id)}
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Issues raised</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.members.map((member) => {
                    const issuesRaisedCount = summary.issues.filter(
                      (issue) => {
                        // In ProjectIssueSummary, we don't have createdByUserId currently, 
                        // so we can't easily filter by member ID here without updating the summary data further.
                        // For now, mirroring the UI structure. If needed, we'll update ProjectIssueSummary.
                        return false
                      }
                    ).length

                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="size-8">
                              <AvatarFallback>{member.avatarFallback}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">
                                {member.firstName} {member.lastName}
                              </span>
                              <span className="text-muted-foreground text-xs">{member.email}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-2">
                            {member.role}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {member.company || "ColbyGallagher"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-normal">
                            {member.status || "Active"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {/* 
                            Note: Issue count calculation might require fetching more data 
                            or updating the project summary map.
                          */}
                          0
                        </TableCell>
                        <TableCell>
                          <MemberActions
                            projectId={id}
                            userId={member.id}
                            userName={`${member.firstName} ${member.lastName}`}
                            currentRoleId={member.roleId}
                            roles={roles}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {summary.members.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        No team members added yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}

