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
    disciplines: string[]
    importances: string[]
}

export function CreateIssueDialog({ projectId, reviews, disciplines, importances }: CreateIssueDialogProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const [reviewId, setReviewId] = React.useState("")
    const [discipline, setDiscipline] = React.useState("")
    const [importance, setImportance] = React.useState("")
    const [comment, setComment] = React.useState("")

    function resetForm() {
        setReviewId("")
        setDiscipline("")
        setImportance("")
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

                    <div className="grid gap-4 py-4">
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

                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-1.5">
                                <Label htmlFor="discipline">Discipline <span className="text-destructive">*</span></Label>
                                <Select value={discipline} onValueChange={setDiscipline}>
                                    <SelectTrigger id="discipline">
                                        <SelectValue placeholder="Select" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {disciplines.map((d) => (
                                            <SelectItem key={d} value={d}>{d}</SelectItem>
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
                                        {importances.map((i) => (
                                            <SelectItem key={i} value={i}>{i}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
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
