"use client"

import * as React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { ReviewUser } from "@/lib/data/reviews"
import { getProjectMemberIssueCount, bulkRemoveProjectUsers } from "@/lib/actions/project-users"

interface RemoveProjectUserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    users: ReviewUser[] // Now accepts an array of users
    allProjectMembers: ReviewUser[]
    onSuccess?: () => void
}

export function RemoveProjectUserDialog({
    open,
    onOpenChange,
    projectId,
    users,
    allProjectMembers,
    onSuccess
}: RemoveProjectUserDialogProps) {
    const [issueCount, setIssueCount] = React.useState<number>(0)
    const [isLoading, setIsLoading] = React.useState(false)
    const [reassignToId, setReassignToId] = React.useState<string>("")
    const [isSubmitting, setIsSubmitting] = React.useState(false)

    React.useEffect(() => {
        if (open && users.length > 0 && projectId) {
            setIsLoading(true)
            const userIds = users.map(u => u.id)
            getProjectMemberIssueCount(projectId, userIds)
                .then(setIssueCount)
                .finally(() => setIsLoading(false))
        }
    }, [open, users, projectId])

    const handleRemove = async () => {
        if (users.length === 0) return
        if (issueCount > 0 && !reassignToId) {
            toast.error("Please select a new owner for the issues")
            return
        }

        setIsSubmitting(true)
        try {
            const userIds = users.map(u => u.id)
            const result = await bulkRemoveProjectUsers(projectId, userIds, reassignToId)
            if (result.success) {
                toast.success(result.message)
                onSuccess?.()
                onOpenChange(false)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    const removedUserIds = new Set(users.map(u => u.id))
    const eligibleReassignees = allProjectMembers.filter(m => !removedUserIds.has(m.id))

    const userNames = users.length === 1 
        ? <strong>{users[0].firstName} {users[0].lastName}</strong>
        : <span><strong>{users.length} users</strong></span>

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="size-5" />
                        {users.length === 1 ? "Remove member" : "Remove members"}
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove {userNames} from this project?
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : issueCount > 0 ? (
                        <div className="space-y-4 rounded-md bg-destructive/10 p-4 border border-destructive/20">
                            <p className="text-sm font-medium text-destructive">
                                Important: {users.length === 1 ? "This user" : "These users"} created {issueCount} issue{issueCount === 1 ? "" : "s"} in this project.
                            </p>
                            <p className="text-sm text-destructive/80">
                                You must reassign these issues to another project member before removal.
                            </p>
                            
                            <div className="space-y-2">
                                <Label htmlFor="reassign" className="text-xs text-destructive font-bold uppercase">Reassign issues to:</Label>
                                <Select value={reassignToId} onValueChange={setReassignToId}>
                                    <SelectTrigger id="reassign" className="border-destructive/30 focus:ring-destructive/20">
                                        <SelectValue placeholder="Select a new owner..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {eligibleReassignees.length > 0 ? (
                                            eligibleReassignees.map(m => (
                                                <SelectItem key={m.id} value={m.id}>
                                                    {m.firstName} {m.lastName} ({m.company})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <SelectItem value="none" disabled>No other members available</SelectItem>
                                        )}
                                    </SelectContent>
                                </Select>
                                {eligibleReassignees.length === 0 && (
                                    <p className="text-[10px] text-destructive">Warning: You cannot remove all project members if issues exist.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            {users.length === 1 ? "This user has" : "These users have"} no issues assigned to them. Removing them will revoke their access immediately.
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={handleRemove} 
                        disabled={isSubmitting || (issueCount > 0 && !reassignToId) || (issueCount > 0 && eligibleReassignees.length === 0)}
                    >
                        {isSubmitting ? "Removing..." : users.length === 1 ? "Remove User" : `Remove ${users.length} Users`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
