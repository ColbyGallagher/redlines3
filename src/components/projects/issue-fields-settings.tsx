"use client"

import * as React from "react"
import { toast } from "sonner"
import { Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { addLookupItem, updateLookupItem, deleteLookupItem, LookupTable } from "@/lib/actions/project-settings"
import type { ProjectMilestone, ProjectDiscipline, ProjectImportance, ProjectState, ProjectStatus, ProjectPackage, ProjectClassification } from "@/lib/db/types"

interface IssueFieldsSettingsProps {
    projectId: string
    milestones: ProjectMilestone[]
    disciplines: ProjectDiscipline[]
    importances: ProjectImportance[]
    states: ProjectState[]
    statuses: ProjectStatus[]
    packages: ProjectPackage[]
    classifications: ProjectClassification[]
}

type Item = { id: string; name: string; description?: string | null }

export function IssueFieldsSettings({
    projectId,
    milestones,
    disciplines,
    importances,
    states,
    statuses,
    packages,
    classifications,
}: IssueFieldsSettingsProps) {
    const [isPending, startTransition] = React.useTransition()
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)
    const [currentItem, setCurrentItem] = React.useState<{ id?: string; name: string; description?: string } | null>(null)
    const [itemToDelete, setItemToDelete] = React.useState<{ id: string; name: string } | null>(null)
    const [activeTab, setActiveTab] = React.useState<LookupTable>("project_milestones")

    const handleAdd = () => {
        setCurrentItem({ name: "", description: "" })
        setIsDialogOpen(true)
    }

    const handleEdit = (item: Item) => {
        setCurrentItem({ id: item.id, name: item.name, description: item.description ?? "" })
        setIsDialogOpen(true)
    }

    const handleDeleteClick = (item: Item) => {
        setItemToDelete({ id: item.id, name: item.name })
        setIsDeleteDialogOpen(true)
    }

    const onSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!currentItem) return

        startTransition(async () => {
            const result = currentItem.id
                ? await updateLookupItem(projectId, activeTab, currentItem.id, currentItem.name, currentItem.description)
                : await addLookupItem(projectId, activeTab, currentItem.name, currentItem.description)

            if (result.success) {
                toast.success(`Successfully ${currentItem.id ? "updated" : "added"} item`)
                setIsDialogOpen(false)
                setCurrentItem(null)
            } else {
                toast.error(result.error || "An error occurred")
            }
        })
    }

    const onConfirmDelete = async () => {
        if (!itemToDelete) return

        startTransition(async () => {
            const result = await deleteLookupItem(projectId, activeTab, itemToDelete.id)
            if (result.success) {
                toast.success("Successfully deleted item")
                setIsDeleteDialogOpen(false)
                setItemToDelete(null)
            } else {
                toast.error(result.error || "An error occurred")
            }
        })
    }

    const renderTabContent = (items: Item[], title: string, table: LookupTable) => (
        <TabsContent value={table} className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-medium">{title}</h3>
                    <p className="text-sm text-muted-foreground">Manage {title.toLowerCase()} for this project.</p>
                </div>
                <Button onClick={handleAdd} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add {title.slice(0, -1)}
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            {table === "project_milestones" && <TableHead>Description</TableHead>}
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={table === "project_milestones" ? 3 : 2} className="h-24 text-center">
                                    No items found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            items.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    {table === "project_milestones" && <TableCell>{item.description}</TableCell>}
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                    <Pencil className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleDeleteClick(item)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </TabsContent>
    )

    return (
        <Card className="mt-8">
            <CardHeader>
                <CardTitle>Issue Field Management</CardTitle>
                <CardDescription>
                    Configure the options available in dropdown menus for issues in this project.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LookupTable)} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 h-auto p-1 bg-muted/50">
                        <TabsTrigger value="project_milestones">Milestones</TabsTrigger>
                        <TabsTrigger value="project_disciplines">Disciplines</TabsTrigger>
                        <TabsTrigger value="project_importances">Importances</TabsTrigger>
                        <TabsTrigger value="project_states">States</TabsTrigger>
                        <TabsTrigger value="project_statuses">Statuses</TabsTrigger>
                        <TabsTrigger value="project_packages">Packages</TabsTrigger>
                        <TabsTrigger value="project_classifications">Classifications</TabsTrigger>
                    </TabsList>

                    {renderTabContent(milestones, "Milestones", "project_milestones")}
                    {renderTabContent(disciplines, "Disciplines", "project_disciplines")}
                    {renderTabContent(importances, "Importances", "project_importances")}
                    {renderTabContent(states, "States", "project_states")}
                    {renderTabContent(statuses, "Statuses", "project_statuses")}
                    {renderTabContent(packages, "Packages", "project_packages")}
                    {renderTabContent(classifications, "Classifications", "project_classifications")}
                </Tabs>

                {/* Add/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <form onSubmit={onSave}>
                            <DialogHeader>
                                <DialogTitle>{currentItem?.id ? "Edit" : "Add"} {activeTab.split('_')[1].slice(0, -1)}</DialogTitle>
                                <DialogDescription>
                                    Enter the details for this {activeTab.split('_')[1].slice(0, -1)}.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Name</Label>
                                    <Input
                                        id="name"
                                        value={currentItem?.name || ""}
                                        onChange={(e) => setCurrentItem(prev => ({ ...prev!, name: e.target.value }))}
                                        required
                                    />
                                </div>
                                {activeTab === "project_milestones" && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">Description</Label>
                                        <Input
                                            id="description"
                                            value={currentItem?.description || ""}
                                            onChange={(e) => setCurrentItem(prev => ({ ...prev!, description: e.target.value }))}
                                        />
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending ? "Saving..." : "Save"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete {activeTab.split('_')[1].slice(0, -1)}</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete "{itemToDelete?.name}"? This action cannot be undone and may fail if the item is currently in use.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isPending}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={onConfirmDelete} disabled={isPending}>
                                {isPending ? "Deleting..." : "Delete"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}
