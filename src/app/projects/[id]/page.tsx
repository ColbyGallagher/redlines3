import { notFound } from "next/navigation"

import { InsightCallouts } from "@/components/projects/insight-callouts"
import { IssuesTable } from "@/components/projects/issues-table"
import { ProjectReviewsList } from "@/components/projects/project-reviews-list"
import { ProjectSummaryHeader } from "@/components/projects/project-summary-header"
import { ProjectSettingsSheet } from "@/components/projects/project-settings-sheet"
import { getProjectSummaryById } from "@/lib/mock/projects"

type ProjectDashboardPageProps = {
  params: {
    id: string
  }
}

export default function ProjectDashboardPage({ params }: ProjectDashboardPageProps) {
  const { id } = params

  const summary = getProjectSummaryById(id)

  if (!summary) {
    notFound()
  }

  return (
    <div className="flex flex-1 flex-col">
      <ProjectSummaryHeader
        summary={summary}
        actions={<ProjectSettingsSheet projectId={summary.project.id} />}
      />
      <main className="flex flex-1 flex-col gap-6 p-6 pt-4">
        <InsightCallouts insights={summary.insights} />
        <section className="grid gap-4 lg:grid-cols-12">
          <ProjectReviewsList summary={summary} />
          <IssuesTable issues={summary.issues} />
        </section>
      </main>
    </div>
  )
}

