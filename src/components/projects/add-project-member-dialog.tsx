"use client"

import { useState, useEffect } from "react"
import { Users, Search, Plus, Mail, UserPlus } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ReviewUser } from "@/lib/data/reviews"
import { getAllUsers } from "@/lib/actions/reviews"
import { addProjectMembers, inviteProjectMemberByEmail } from "@/lib/actions/projects"
import { getRoles } from "@/lib/actions/users"

interface AddProjectMemberDialogProps {
    projectId: string
    existingMemberIds: string[]
}

function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export function AddProjectMemberDialog({ projectId, existingMemberIds }: AddProjectMemberDialogProps) {
    const [open, setOpen] = useState(false)
    const [tab, setTab] = useState<"browse" | "invite">("browse")

    // Browse tab state
    const [users, setUsers] = useState<ReviewUser[]>([])
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    // Invite tab state
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteFirstName, setInviteFirstName] = useState("")
    const [inviteLastName, setInviteLastName] = useState("")
    const [emailError, setEmailError] = useState("")

    // Shared state
    const [roles, setRoles] = useState<any[]>([])
    const [selectedRoleId, setSelectedRoleId] = useState<string>("")
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        if (open) {
            void loadData()
            setSelectedUserIds([])
            setInviteEmail("")
            setInviteFirstName("")
            setInviteLastName("")
            setEmailError("")
            setTab("browse")
        }
    }, [open])

    async function loadData() {
        setIsLoading(true)
        try {
            const [allUsers, allRoles] = await Promise.all([getAllUsers(), getRoles()])
            setUsers(allUsers)
            setRoles(allRoles)
            if (allRoles.length > 0) {
                const defaultRole = allRoles.find(r => r.name.toLowerCase() === "reviewer") || allRoles[0]
                setSelectedRoleId(defaultRole.id)
            }
        } catch {
            toast.error("Failed to load data")
        } finally {
            setIsLoading(false)
        }
    }

    const filteredUsers = users.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()
        const matchesSearch =
            fullName.includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase())
        const isAlreadyAdded = existingMemberIds.includes(user.id)
        return matchesSearch && !isAlreadyAdded
    })

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        )
    }

    const handleAddAll = () => {
        setSelectedUserIds(filteredUsers.map(u => u.id))
    }

    async function handleBrowseAdd() {
        if (selectedUserIds.length === 0) return
        setIsSubmitting(true)
        try {
            const result = await addProjectMembers(projectId, selectedUserIds, selectedRoleId)
            if (result.success) {
                toast.success(result.message)
                setOpen(false)
            } else {
                toast.error(result.message)
            }
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    async function handleInvite() {
        const trimmed = inviteEmail.trim()
        if (!isValidEmail(trimmed)) {
            setEmailError("Please enter a valid email address.")
            return
        }
        setEmailError("")
        setIsSubmitting(true)
        try {
            const result = await inviteProjectMemberByEmail(
                projectId,
                trimmed,
                selectedRoleId,
                inviteFirstName,
                inviteLastName
            )
            if (result.success) {
                toast.success(result.message)
                setOpen(false)
            } else {
                toast.error(result.message)
            }
        } catch {
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
            <DialogContent className="sm:max-w-[440px]">
                <DialogHeader>
                    <DialogTitle>Add project member</DialogTitle>
                    <DialogDescription>
                        Browse existing users or invite someone new by email.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={tab} onValueChange={(v) => setTab(v as "browse" | "invite")} className="mt-1">
                    <TabsList className="w-full">
                        <TabsTrigger value="browse" className="flex-1 gap-2">
                            <Users className="size-3.5" />
                            Browse
                        </TabsTrigger>
                        <TabsTrigger value="invite" className="flex-1 gap-2">
                            <Mail className="size-3.5" />
                            Invite by email
                        </TabsTrigger>
                    </TabsList>

                    {/* BROWSE TAB */}
                    <TabsContent value="browse" className="space-y-4 mt-4">
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
                            <div className="max-h-[260px] overflow-y-auto space-y-1 pr-1">
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
                    </TabsContent>

                    {/* INVITE BY EMAIL TAB */}
                    <TabsContent value="invite" className="space-y-4 mt-4">
                        <div className="space-y-2">
                            <Label htmlFor="invite-email" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                Email address <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="name@example.com"
                                value={inviteEmail}
                                onChange={(e) => {
                                    setInviteEmail(e.target.value)
                                    if (emailError) setEmailError("")
                                }}
                            />
                            {emailError && (
                                <p className="text-xs text-destructive">{emailError}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="invite-first" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    First name
                                </Label>
                                <Input
                                    id="invite-first"
                                    placeholder="Jane"
                                    value={inviteFirstName}
                                    onChange={(e) => setInviteFirstName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invite-last" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                    Last name
                                </Label>
                                <Input
                                    id="invite-last"
                                    placeholder="Smith"
                                    value={inviteLastName}
                                    onChange={(e) => setInviteLastName(e.target.value)}
                                />
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            If the email matches an existing account it will be added directly. Otherwise a new account placeholder will be created.
                        </p>
                    </TabsContent>
                </Tabs>

                {/* Shared role selector */}
                <div className="space-y-2 border-t pt-4">
                    <Label htmlFor="role" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Assign Role
                    </Label>
                    <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                        <SelectTrigger id="role">
                            <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map(r => (
                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    {tab === "browse" ? (
                        <Button
                            disabled={selectedUserIds.length === 0 || isSubmitting}
                            onClick={handleBrowseAdd}
                        >
                            {isSubmitting
                                ? "Adding..."
                                : `Add ${selectedUserIds.length > 0 ? selectedUserIds.length : ""} selected`}
                        </Button>
                    ) : (
                        <Button
                            disabled={!inviteEmail.trim() || isSubmitting}
                            onClick={handleInvite}
                            className="gap-2"
                        >
                            <UserPlus className="size-4" />
                            {isSubmitting ? "Inviting..." : "Invite"}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
