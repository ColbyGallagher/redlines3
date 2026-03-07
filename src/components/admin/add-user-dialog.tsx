"use client"

import { useState } from "react"
import { Plus, X, UserPlus, Mail } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { bulkAddUsers } from "@/lib/actions/users"

interface AddUserDialogProps {
    companies: any[]
    roles: any[]
    currentUserRole: string | null
    onSuccess?: () => void
}

interface NewUserEntry {
    email: string
    first_name: string
    last_name: string
    company_id: string
    role_id: string
}

export function AddUserDialog({ companies, roles, currentUserRole, onSuccess }: AddUserDialogProps) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<1 | 2>(1)
    const [rawText, setRawText] = useState("")
    const [users, setUsers] = useState<NewUserEntry[]>([])
    const [isLoading, setIsLoading] = useState(false)

    const reset = () => {
        setStep(1)
        setRawText("")
        setUsers([])
        setIsLoading(false)
    }

    const handleExtractEmails = () => {
        const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
        const matches = Array.from(new Set(rawText.match(emailRegex) || []))

        if (matches.length === 0) {
            toast.error("No valid email addresses found.")
            return
        }

        const newUsers: NewUserEntry[] = matches.map(email => ({
            email: email.toLowerCase(),
            first_name: "",
            last_name: "",
            company_id: companies[0]?.id || "",
            role_id: roles[0]?.id || ""
        }))

        setUsers(newUsers)
        setStep(2)
    }

    const handleUpdateUser = (index: number, field: keyof NewUserEntry, value: string) => {
        const updated = [...users]
        updated[index] = { ...updated[index], [field]: value }
        setUsers(updated)
    }

    const handleRemoveUser = (index: number) => {
        setUsers(users.filter((_, i) => i !== index))
        if (users.length <= 1) setStep(1)
    }

    const handleAddUsers = async () => {
        setIsLoading(true)
        try {
            const result = await bulkAddUsers(users)
            if (result.success) {
                toast.success(result.message)
                setOpen(false)
                reset()
                onSuccess?.()
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            toast.error("An error occurred while adding users.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <UserPlus className="h-4 w-4" />
                    Add Users
                </Button>
            </DialogTrigger>
            <DialogContent className={step === 2 ? "sm:max-w-[800px] max-h-[90vh]" : "sm:max-w-[425px]"}>
                <DialogHeader>
                    <DialogTitle>{step === 1 ? "Add Users" : "Configure Users"}</DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? "Paste a list of email addresses from any source. We'll automatically find the emails."
                            : `Review and complete details for ${users.length} users.`}
                    </DialogDescription>
                </DialogHeader>

                {step === 1 ? (
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="emails">Paste emails here</Label>
                            <Textarea
                                id="emails"
                                placeholder="Example: john@company.com, sarah@other.com..."
                                className="min-h-[150px]"
                                value={rawText}
                                onChange={(e) => setRawText(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        <div className="h-[400px] overflow-y-auto rounded-md border p-4">
                            <div className="space-y-6">
                                {users.map((user, index) => (
                                    <div key={user.email} className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-6 border-b last:border-0 last:pb-0">
                                        <div className="md:col-span-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-sm font-medium">
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                {user.email}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => handleRemoveUser(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs">First Name</Label>
                                            <Input
                                                placeholder="First Name"
                                                value={user.first_name}
                                                onChange={(e) => handleUpdateUser(index, "first_name", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs">Last Name</Label>
                                            <Input
                                                placeholder="Last Name"
                                                value={user.last_name}
                                                onChange={(e) => handleUpdateUser(index, "last_name", e.target.value)}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs">Company</Label>
                                            <Select
                                                value={user.company_id}
                                                onValueChange={(v) => handleUpdateUser(index, "company_id", v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select company" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {companies.map(c => (
                                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label className="text-xs">Role</Label>
                                            <Select
                                                value={user.role_id}
                                                onValueChange={(v) => handleUpdateUser(index, "role_id", v)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {roles
                                                        .filter(r => r.name.toLowerCase() !== 'org admin' || currentUserRole === 'developer')
                                                        .map(r => (
                                                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2 sm:gap-0">
                    {step === 1 ? (
                        <>
                            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button disabled={!rawText.trim()} onClick={handleExtractEmails}>Next</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                            <Button disabled={isLoading} onClick={handleAddUsers}>
                                {isLoading ? "Adding..." : `Add ${users.length} Users`}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
