import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { ProjectSettingsForm } from "@/components/projects/project-settings-form"
import { getProjectSummaryById } from "@/lib/data/projects"
import { Button } from "@/components/ui/button"

type ProjectSettingsPageProps = {
    params: Promise<{
        id: string
    }>
}

export default async function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
    const { id } = await params
    const summary = await getProjectSummaryById(id)

    if (!summary) {
        redirect("/projects")
    }

    return (
        <div className="flex flex-1 flex-col">
            <header className="border-b bg-card px-6 py-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="-ml-2">
                        <Link href={`/projects/${id}`}>
                            <ChevronLeft className="size-5" />
                            <span className="sr-only">Back to project</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Project Settings</h1>
                        <p className="text-muted-foreground text-sm">
                            Configure milestones and standards for {summary.project.projectName}
                        </p>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-4xl py-8">
                    <ProjectSettingsForm projectId={id} />
                </div>
            </main>
        </div>
    )
}
