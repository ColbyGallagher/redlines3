"use client"

import { useState, useEffect } from "react"
import { Users, Search, Plus } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import type { ReviewUser } from "@/lib/data/reviews"
import { getAllUsers } from "@/lib/actions/reviews"
import { addProjectMembers } from "@/lib/actions/projects"

interface AddProjectMemberDialogProps {
    projectId: string
    existingMemberIds: string[]
}

export function AddProjectMemberDialog({ projectId, existingMemberIds }: AddProjectMemberDialogProps) {
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState<ReviewUser[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            void loadUsers()
            setSelectedUserIds([])
        }
    }, [open])

    async function loadUsers() {
        setIsLoading(true)
        try {
            const allUsers = await getAllUsers()
            setUsers(allUsers)
        } catch (error) {
            toast.error("Failed to load users")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredUsers = users.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
        const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        const isAlreadyAdded = existingMemberIds.includes(user.id)
        return matchesSearch && !isAlreadyAdded
    })

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleAddAll = () => {
        const allIds = filteredUsers.map(u => u.id)
        setSelectedUserIds(allIds)
    }

    async function handleConfirmAdd() {
        if (selectedUserIds.length === 0) return

        setIsSubmitting(true)
        try {
            const result = await addProjectMembers(projectId, selectedUserIds)
            if (result.success) {
                toast.success(result.message)
                setOpen(false)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="size-4" />
                    Add member
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add project member</DialogTitle>
                    <DialogDescription>
                        Select one or more people to add to the project team.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search people..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleAddAll}
                            disabled={filteredUsers.length === 0}
                        >
                            Select all
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Suggested people
                            </p>
                            {selectedUserIds.length > 0 && (
                                <p className="text-xs text-primary font-medium">
                                    {selectedUserIds.length} selected
                                </p>
                            )}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
                            {isLoading ? (
                                <p className="text-sm text-center py-4 text-muted-foreground">Loading users...</p>
                            ) : filteredUsers.length === 0 ? (
                                <p className="text-sm text-center py-4 text-muted-foreground">
                                    {searchQuery ? "No users found" : "No more users to add"}
                                </p>
                            ) : (
                                filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => toggleUserSelection(user.id)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Checkbox
                                                checked={selectedUserIds.includes(user.id)}
                                                onCheckedChange={() => toggleUserSelection(user.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <Avatar className="size-8">
                                                <AvatarFallback>{user.avatarFallback}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {user.firstName} {user.lastName}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{user.email}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        disabled={selectedUserIds.length === 0 || isSubmitting}
                        onClick={handleConfirmAdd}
                    >
                        {isSubmitting ? "Adding..." : `Add ${selectedUserIds.length > 0 ? selectedUserIds.length : ""} selected`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
