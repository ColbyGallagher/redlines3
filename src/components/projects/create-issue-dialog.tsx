"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { ProjectSummary } from "@/lib/data/projects"

type CreateIssueDialogProps = {
    projectId: string
    reviews: ProjectSummary["reviews"]
    settings: ProjectSummary["settings"]
    members: ProjectSummary["members"]
    documents: { id: string; name: string; code: string | null }[]
}

export function CreateIssueDialog({ projectId, reviews, settings, members, documents }: CreateIssueDialogProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const [reviewId, setReviewId] = React.useState("")
    const [discipline, setDiscipline] = React.useState("")
    const [importance, setImportance] = React.useState("")
    const [milestone, setMilestone] = React.useState("")
    const [state, setState] = React.useState("")
    const [status, setStatus] = React.useState("")
    const [packageId, setPackageId] = React.useState("")
    const [documentId, setDocumentId] = React.useState("")
    const [reviewerId, setReviewerId] = React.useState("")
    const [classification, setClassification] = React.useState("")
    const [comment, setComment] = React.useState("")

    function resetForm() {
        setReviewId("")
        setDiscipline("")
        setImportance("")
        setMilestone("")
        setState("")
        setStatus("")
        setPackageId("")
        setDocumentId("")
        setReviewerId("")
        setClassification("")
        setComment("")
    }

    const isValid = reviewId && discipline && importance

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!isValid) {
            toast.error("Please fill in all required fields.")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/issues", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    projectId,
                    reviewId,
                    discipline,
                    importance,
                    milestone: milestone || undefined,
                    state: state || undefined,
                    status: status || undefined,
                    package: packageId || undefined,
                    documentId: documentId || undefined,
                    document_number: documentId || undefined, // Referring to the same doc
                    document_title: documentId || undefined, // Referring to the same doc
                    reviewers_name: reviewerId || undefined,
                    classification: classification || undefined,
                    comment: comment || undefined,
                }),
            })

            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error ?? "Failed to create issue")
            }

            toast.success("Issue created successfully.")
            setOpen(false)
            resetForm()
            router.refresh()
        } catch (err) {
            console.error(err)
            toast.error(err instanceof Error ? err.message : "Failed to create issue.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm() }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="mr-1 size-4" />
                    New issue
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create issue</DialogTitle>
                        <DialogDescription>
                            Log a new issue against a review on this project.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="reviewId">Review <span className="text-destructive">*</span></Label>
                                <Select value={reviewId} onValueChange={setReviewId}>
                                    <SelectTrigger id="reviewId">
                                        <SelectValue placeholder="Select review" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {reviews.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>{r.reviewName}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="milestone">Milestone</Label>
                                <Select value={milestone} onValueChange={setMilestone}>
                                    <SelectTrigger id="milestone">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {settings.availableMilestones.map((m) => (
                                            <SelectItem key={m.name} value={m.name}>{m.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="discipline">Discipline <span className="text-destructive">*</span></Label>
                                <Select value={discipline} onValueChange={setDiscipline}>
                                    <SelectTrigger id="discipline">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {settings.disciplines.map((d) => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="importance">Importance <span className="text-destructive">*</span></Label>
                                <Select value={importance} onValueChange={setImportance}>
                                    <SelectTrigger id="importance">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {settings.importances.map((i) => (
                                        <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="state">State</Label>
                                <Select value={state} onValueChange={setState}>
                                    <SelectTrigger id="state">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {settings.states.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="status">Status</Label>
                                <Select value={status} onValueChange={setStatus}>
                                    <SelectTrigger id="status">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {settings.statuses.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="package">Package</Label>
                                <Select value={packageId} onValueChange={setPackageId}>
                                    <SelectTrigger id="package">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {settings.packages.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-1.5">
                                <Label htmlFor="classification">Classification</Label>
                                <Select value={classification} onValueChange={setClassification}>
                                    <SelectTrigger id="classification">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                    {settings.classifications.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="documentId">Document</Label>
                            <Select value={documentId} onValueChange={setDocumentId}>
                                <SelectTrigger id="documentId">
                                    <SelectValue placeholder="Select document" />
                                </SelectTrigger>
                                <SelectContent>
                                    {documents.map((doc) => (
                                        <SelectItem key={doc.id} value={doc.id}>
                                            {doc.code ? `${doc.code} - ` : ""}{doc.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="reviewer">Reviewer</Label>
                            <Select value={reviewerId} onValueChange={setReviewerId}>
                                <SelectTrigger id="reviewer">
                                    <SelectValue placeholder="Select reviewer" />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.firstName} {m.lastName} ({m.role})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="comment">Comment</Label>
                            <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Describe the issue..."
                                className="resize-none"
                                rows={3}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !isValid}>
                            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Create issue
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
