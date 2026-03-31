"use client"

import * as React from "react"
import { Search, Plus, UserPlus, Check, ChevronRight, ChevronLeft, ArrowRight, Table as TableIcon } from "lucide-react"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import type { ReviewUser } from "@/lib/data/reviews"
import { getAllGlobalUsers, addProjectUsers } from "@/lib/actions/project-users"
import { cn } from "@/lib/utils"

interface AddProjectUserDialogProps {
    projectId: string
    existingMemberIds: string[]
}

const PROJECT_ROLES = ["Admin", "Reviewer", "Client", "Consultant"]

export function AddProjectUserDialog({ projectId, existingMemberIds }: AddProjectUserDialogProps) {
    const [open, setOpen] = React.useState(false)
    const [step, setStep] = React.useState<1 | 2>(1)
    const [users, setUsers] = React.useState<ReviewUser[]>([])
    const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([])
    const [step2Selection, setStep2Selection] = React.useState<string[]>([])
    const [userRoles, setUserRoles] = React.useState<Record<string, string>>({})
    const [searchQuery, setSearchQuery] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)
    const [isSubmitting, setIsSubmitting] = React.useState(false)
    const [bulkRole, setBulkRole] = React.useState<string>("Reviewer")

    React.useEffect(() => {
        if (open) {
            void loadUsers()
            setSelectedUserIds([])
            setStep2Selection([])
            setUserRoles({})
            setStep(1)
        }
    }, [open])

    // Update Step 2 selection whenever we enter Step 2
    React.useEffect(() => {
        if (step === 2) {
            setStep2Selection(selectedUserIds)
        }
    }, [step, selectedUserIds])

    async function loadUsers() {
        setIsLoading(true)
        try {
            const allUsers = await getAllGlobalUsers()
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

    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id))

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const toggleStep2Selection = (userId: string) => {
        setStep2Selection(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        )
    }

    const handleAddAll = () => {
        const allIds = filteredUsers.map(u => u.id)
        setSelectedUserIds(allIds)
    }

    const handleSelectAllStep2 = () => {
        if (step2Selection.length === selectedUserIds.length) {
            setStep2Selection([])
        } else {
            setStep2Selection(selectedUserIds)
        }
    }

    const handleRoleChange = (userId: string, role: string) => {
        setUserRoles(prev => ({ ...prev, [userId]: role }))
    }

    const handleBulkApply = () => {
        if (step2Selection.length === 0) {
            toast.error("Please select at least one user to bulk assign.")
            return
        }
        const updatedRoles: Record<string, string> = { ...userRoles }
        step2Selection.forEach(id => {
            updatedRoles[id] = bulkRole
        })
        setUserRoles(updatedRoles)
        toast.info(`Set ${step2Selection.length} users to ${bulkRole}`)
    }

    async function handleConfirmAdd() {
        if (selectedUserIds.length === 0) return

        setIsSubmitting(true)
        try {
            const payload = selectedUserIds.map(userId => ({
                user_id: userId,
                role: userRoles[userId] || "Reviewer"
            }))

            const result = await addProjectUsers(projectId, payload)
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
                <Button className="gap-2">
                    <UserPlus className="size-4" />
                    Add users
                </Button>
            </DialogTrigger>
            <DialogContent className={cn(
                "transition-all duration-300",
                step === 1 ? "sm:max-w-[425px]" : "sm:max-w-4xl"
            )}>
                <DialogHeader>
                    <DialogTitle>{step === 1 ? "Add users to project" : "Assign project roles"}</DialogTitle>
                    <DialogDescription>
                        {step === 1 
                            ? "Search for people to add to this project." 
                            : `Assign a project role for the ${selectedUserIds.length} selected user${selectedUserIds.length === 1 ? "" : "s"}.`}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 min-h-[300px]">
                    {step === 1 ? (
                        <>
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
                                        Global users
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
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
                                                            <span className="text-[10px] bg-muted px-1 rounded text-muted-foreground">{user.company}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                                <div className="flex items-center gap-2">
                                    <TableIcon className="size-4 text-primary" />
                                    <span className="text-sm font-medium">Bulk Assign {step2Selection.length} users:</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={bulkRole} onValueChange={setBulkRole}>
                                        <SelectTrigger className="w-[180px] h-9">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PROJECT_ROLES.map(role => (
                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button size="sm" onClick={handleBulkApply} disabled={step2Selection.length === 0}>
                                        Apply to {step2Selection.length} selected
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-md border max-h-[400px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-muted/50 sticky top-0 md:relative md:z-auto">
                                        <TableRow>
                                            <TableHead className="w-[40px]">
                                                <Checkbox 
                                                    checked={step2Selection.length === selectedUserIds.length && selectedUserIds.length > 0} 
                                                    onCheckedChange={handleSelectAllStep2}
                                                />
                                            </TableHead>
                                            <TableHead>User</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Company</TableHead>
                                            <TableHead className="w-[200px]">Project Role</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedUsers.map((user) => (
                                            <TableRow key={user.id}>
                                                <TableCell>
                                                    <Checkbox 
                                                        checked={step2Selection.includes(user.id)} 
                                                        onCheckedChange={() => toggleStep2Selection(user.id)}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="size-8 text-[10px]">
                                                            <AvatarFallback>{user.avatarFallback}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium whitespace-nowrap">{user.firstName} {user.lastName}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground font-mono text-xs">{user.email}</TableCell>
                                                <TableCell><span className="text-xs">{user.company}</span></TableCell>
                                                <TableCell>
                                                    <Select 
                                                        value={userRoles[user.id] || "Reviewer"} 
                                                        onValueChange={(v) => handleRoleChange(user.id, v)}
                                                    >
                                                        <SelectTrigger className="h-8 border-primary/20 hover:border-primary/50 transition-colors">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {PROJECT_ROLES.map(role => (
                                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
                    <Button variant="ghost" onClick={() => step === 1 ? setOpen(false) : setStep(1)} disabled={isSubmitting}>
                        {step === 1 ? "Cancel" : <><ChevronLeft className="size-4 mr-1"/> Back to selection</>}
                    </Button>
                    <Button
                        disabled={selectedUserIds.length === 0 || isSubmitting}
                        onClick={() => step === 1 ? setStep(2) : handleConfirmAdd()}
                        className="px-6"
                    >
                        {isSubmitting ? "Adding..." : (
                            step === 1 ? <><Check className="size-4 mr-1"/> Next: Assign Roles</> : `Add ${selectedUserIds.length} user${selectedUserIds.length === 1 ? "" : "s"}`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
