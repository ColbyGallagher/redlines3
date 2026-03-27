import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { ProjectSettingsForm } from "@/components/projects/project-settings-form"
import { IssueFieldsSettings } from "@/components/projects/issue-fields-settings"
import { WorkflowSettings } from "@/components/projects/workflow-settings"
import { getProjectSummaryById } from "@/lib/data/projects"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

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

    const { settings } = summary

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
                    <div className="space-y-1">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/dashboard">Home</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href="/projects">Projects</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink href={`/projects/${id}`}>{summary.project.projectName}</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Project settings</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">Project Settings</h1>
                            <p className="text-muted-foreground text-sm">
                                Configure standards for {summary.project.projectName}
                            </p>
                        </div>
                    </div>
                </div>
            </header>
            <main className="flex-1 overflow-y-auto pb-12">
                <div className="mx-auto max-w-5xl py-8 px-6">
                    <Tabs defaultValue="workflow" className="space-y-8">
                        <TabsList className="bg-muted/50 p-1">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="workflow">Workflow</TabsTrigger>
                            <TabsTrigger value="fields">Issue Fields</TabsTrigger>
                        </TabsList>

                        <TabsContent value="general">
                            <ProjectSettingsForm projectId={id} />
                        </TabsContent>

                        <TabsContent value="workflow">
                            <WorkflowSettings projectId={id} />
                        </TabsContent>

                        <TabsContent value="fields">
                            <IssueFieldsSettings 
                                projectId={id}
                                milestones={summary.settings.availableMilestones.map((m) => ({ 
                                    id: m.id,
                                    project_id: id,
                                    name: m.name,
                                    description: m.description || null,
                                    is_selected: summary.settings.selectedMilestones.includes(m.name)
                                }))}
                                disciplines={settings.disciplines}
                                importances={settings.importances}
                                states={settings.states}
                                statuses={settings.statuses}
                                packages={settings.packages}
                                classifications={settings.classifications}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    )
}
