"use client"

import { useState } from "react"
import { Edit2 } from "lucide-react"
import { toast } from "sonner"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { updateProjectMemberRole } from "@/lib/actions/projects"

interface EditProjectMemberRoleDialogProps {
    projectId: string
    userId: string
    userName: string
    currentRoleId?: string
    roles: any[]
}

export function EditProjectMemberRoleDialog({
    projectId,
    userId,
    userName,
    currentRoleId,
    roles
}: EditProjectMemberRoleDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId || "")

    const handleUpdate = async () => {
        if (!selectedRoleId) {
            toast.error("Please select a role")
            return
        }

        setIsLoading(true)
        try {
            const result = await updateProjectMemberRole(projectId, userId, selectedRoleId)
            if (result.success) {
                toast.success(result.message)
                setOpen(false)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("An error occurred while updating the role.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit2 className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Member Role</DialogTitle>
                    <DialogDescription>
                        Change the role for {userName} in this project.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role" className="text-right">Role</Label>
                        <Select
                            value={selectedRoleId}
                            onValueChange={setSelectedRoleId}
                        >
                            <SelectTrigger id="role" className="col-span-3">
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                {roles.map(r => (
                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button disabled={isLoading || !selectedRoleId} onClick={handleUpdate}>
                        {isLoading ? "Saving..." : "Save changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
