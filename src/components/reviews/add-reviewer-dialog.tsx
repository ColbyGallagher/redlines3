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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import type { ReviewUser } from "@/lib/data/reviews"
import { getAllUsers, addReviewers } from "@/lib/actions/reviews"
import { cn } from "@/lib/utils"

interface AddReviewerDialogProps {
    reviewId: string
    existingReviewerIds: string[]
    projectMemberRoles: Record<string, string>
}

export function AddReviewerDialog({ reviewId, existingReviewerIds, projectMemberRoles }: AddReviewerDialogProps) {
    const [open, setOpen] = useState(false)
    const [users, setUsers] = useState<ReviewUser[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const projectMemberIds = Object.keys(projectMemberRoles)

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
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (user.jobTitle || "").toLowerCase().includes(searchQuery.toLowerCase())
        
        const isAlreadyAdded = existingReviewerIds.includes(user.id)
        return matchesSearch && !isAlreadyAdded
    })

    const projectUsers = filteredUsers.filter(u => projectMemberIds.includes(u.id))
    const globalUsers = filteredUsers.filter(u => !projectMemberIds.includes(u.id))

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleSelectAll = (usersList: ReviewUser[]) => {
        const listIds = usersList.map(u => u.id)
        const allAlreadySelected = listIds.every(id => selectedUserIds.includes(id))
        
        if (allAlreadySelected) {
            setSelectedUserIds(prev => prev.filter(id => !listIds.includes(id)))
        } else {
            setSelectedUserIds(prev => Array.from(new Set([...prev, ...listIds])))
        }
    }

    async function handleConfirmAdd() {
        if (selectedUserIds.length === 0) return

        setIsSubmitting(true)
        try {
            const result = await addReviewers(reviewId, selectedUserIds)
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
                    Add reviewer
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1400px] w-[95vw] max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>Add reviewer</DialogTitle>
                    <DialogDescription>
                        Select one or more people to add to the specialized team.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex flex-col min-h-0">
                    <div className="px-6 py-4 border-b bg-muted/20">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                placeholder="Search people by name, email, company or job title..."
                                className="pl-9 bg-background"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12 text-muted-foreground">
                                <p>Loading users...</p>
                            </div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <Users className="size-12 mb-4 opacity-20" />
                                <p>{searchQuery ? "No matching users found" : "No more users to add"}</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead className="w-[50px]"></TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Job Title</TableHead>
                                        <TableHead>Permission Level</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {projectUsers.length > 0 && (
                                        <>
                                            <TableRow className="bg-muted hover:bg-muted font-semibold">
                                                <TableCell colSpan={6} className="py-2 px-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs uppercase tracking-wider">Project Members</span>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-7 text-[10px] uppercase font-bold"
                                                            onClick={() => handleSelectAll(projectUsers)}
                                                        >
                                                            {projectUsers.every(u => selectedUserIds.includes(u.id)) ? "Deselect Group" : "Select Group"}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {projectUsers.map((user) => (
                                                <TableRow 
                                                    key={user.id} 
                                                    className={cn("cursor-pointer", selectedUserIds.includes(user.id) && "bg-primary/5")}
                                                    onClick={() => toggleUserSelection(user.id)}
                                                >
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            checked={selectedUserIds.includes(user.id)}
                                                            onCheckedChange={() => toggleUserSelection(user.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="size-8">
                                                                <AvatarFallback>{user.avatarFallback}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium whitespace-nowrap">
                                                                {user.firstName} {user.lastName}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                                    <TableCell>{user.company || "-"}</TableCell>
                                                    <TableCell>{user.jobTitle || "-"}</TableCell>
                                                    <TableCell>
                                                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 uppercase">
                                                            {projectMemberRoles[user.id] || "Member"}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    )}

                                    {globalUsers.length > 0 && (
                                        <>
                                            <TableRow className="bg-muted hover:bg-muted font-semibold">
                                                <TableCell colSpan={6} className="py-2 px-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs uppercase tracking-wider">Global Users</span>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-7 text-[10px] uppercase font-bold"
                                                            onClick={() => handleSelectAll(globalUsers)}
                                                        >
                                                            {globalUsers.every(u => selectedUserIds.includes(u.id)) ? "Deselect Group" : "Select Group"}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            {globalUsers.map((user) => (
                                                <TableRow 
                                                    key={user.id} 
                                                    className={cn("cursor-pointer", selectedUserIds.includes(user.id) && "bg-primary/5")}
                                                    onClick={() => toggleUserSelection(user.id)}
                                                >
                                                    <TableCell onClick={(e) => e.stopPropagation()}>
                                                        <Checkbox
                                                            checked={selectedUserIds.includes(user.id)}
                                                            onCheckedChange={() => toggleUserSelection(user.id)}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-3">
                                                            <Avatar className="size-8">
                                                                <AvatarFallback>{user.avatarFallback}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium whitespace-nowrap">
                                                                {user.firstName} {user.lastName}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                                    <TableCell>{user.company || "-"}</TableCell>
                                                    <TableCell>{user.jobTitle || "-"}</TableCell>
                                                    <TableCell className="text-muted-foreground italic text-xs">Not in project</TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-6 border-t bg-muted/10">
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm text-muted-foreground">
                            {selectedUserIds.length > 0 ? (
                                <span className="font-medium text-primary">{selectedUserIds.length} users selected</span>
                            ) : (
                                "No users selected"
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                disabled={selectedUserIds.length === 0 || isSubmitting}
                                onClick={handleConfirmAdd}
                                className="min-w-[120px]"
                            >
                                {isSubmitting ? "Adding..." : `Add Selected`}
                            </Button>
                        </div>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
