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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type CreateReviewDialogProps = {
    projectId: string
    projectSlug?: string
    milestones: string[]
}

export function CreateReviewDialog({ projectId, projectSlug, milestones }: CreateReviewDialogProps) {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    const [reviewName, setReviewName] = React.useState("")
    const [reviewNumber, setReviewNumber] = React.useState("")
    const [milestone, setMilestone] = React.useState("")
    const [dueDateSmeReview, setDueDateSmeReview] = React.useState("")
    const [dueDateIssueComments, setDueDateIssueComments] = React.useState("")
    const [dueDateReplies, setDueDateReplies] = React.useState("")

    function resetForm() {
        setReviewName("")
        setReviewNumber("")
        setMilestone("")
        setDueDateSmeReview("")
        setDueDateIssueComments("")
        setDueDateReplies("")
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!reviewName.trim()) {
            toast.error("Review name is required.")
            return
        }

        setIsSubmitting(true)
        try {
            const res = await fetch("/api/reviews", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    reviewName,
                    reviewNumber: reviewNumber || undefined,
                    milestone: milestone || undefined,
                    dueDateSmeReview: dueDateSmeReview || undefined,
                    dueDateIssueComments: dueDateIssueComments || undefined,
                    dueDateReplies: dueDateReplies || undefined,
                    projectId,
                }),
            })

            const json = await res.json()

            if (!res.ok) {
                throw new Error(json.error ?? "Failed to create review")
            }

            const reviewSlug = json.review?.slug
            const reviewId = json.review?.id

            toast.success("Review created successfully.")
            setOpen(false)
            resetForm()

            if (reviewSlug && projectSlug) {
                router.push(`/${projectSlug}/${reviewSlug}`)
            } else if (reviewId) {
                router.push(`/${projectSlug || projectId}/${reviewId}`)
            } else {
                router.refresh()
            }
        } catch (err) {
            console.error(err)
            toast.error(err instanceof Error ? err.message : "Failed to create review.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm() }}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Plus className="mr-1 size-4" />
                    New review
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[480px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create review</DialogTitle>
                        <DialogDescription>
                            Add a new review to this project. Only the review name is required.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="reviewName">Review name <span className="text-destructive">*</span></Label>
                            <Input
                                id="reviewName"
                                value={reviewName}
                                onChange={(e) => setReviewName(e.target.value)}
                                placeholder="e.g. Stage 2 Design Review"
                                required
                            />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="reviewNumber">Review number</Label>
                            <Input
                                id="reviewNumber"
                                value={reviewNumber}
                                onChange={(e) => setReviewNumber(e.target.value)}
                                placeholder="e.g. RV-001"
                            />
                        </div>

                        {milestones.length > 0 && (
                            <div className="grid gap-1.5">
                                <Label htmlFor="milestone">Milestone</Label>
                                <Select value={milestone} onValueChange={setMilestone}>
                                    <SelectTrigger id="milestone">
                                        <SelectValue placeholder="Select milestone" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {milestones.map((m) => (
                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="grid gap-1.5">
                                <Label htmlFor="dueDateSmeReview">SME review due</Label>
                                <Input
                                    id="dueDateSmeReview"
                                    type="date"
                                    value={dueDateSmeReview}
                                    onChange={(e) => setDueDateSmeReview(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="dueDateIssueComments">Issue comments due</Label>
                                <Input
                                    id="dueDateIssueComments"
                                    type="date"
                                    value={dueDateIssueComments}
                                    onChange={(e) => setDueDateIssueComments(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-1.5">
                                <Label htmlFor="dueDateReplies">Replies due</Label>
                                <Input
                                    id="dueDateReplies"
                                    type="date"
                                    value={dueDateReplies}
                                    onChange={(e) => setDueDateReplies(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !reviewName.trim()}>
                            {isSubmitting && <Loader2 className="mr-2 size-4 animate-spin" />}
                            Create review
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
