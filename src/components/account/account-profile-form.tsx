"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { updateProfile } from "@/lib/actions/user"

interface AccountProfileFormProps {
    initialData: {
        firstName: string
        lastName: string
        email: string
        jobTitle: string
    }
}

export function AccountProfileForm({ initialData }: AccountProfileFormProps) {
    const [firstName, setFirstName] = useState(initialData.firstName)
    const [lastName, setLastName] = useState(initialData.lastName)
    const [jobTitle, setJobTitle] = useState(initialData.jobTitle)
    const [isPending, startTransition] = useTransition()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            const result = await updateProfile({ firstName, lastName, jobTitle })
            if (result.success) {
                toast.success(result.message ?? "Profile updated.")
            } else {
                toast.error(result.message ?? "Failed to save profile.")
            }
        })
    }

    return (
        <form onSubmit={handleSubmit}>
            <Card>
                <CardHeader>
                    <CardTitle>Profile Details</CardTitle>
                    <CardDescription>
                        Update your personal information. Changes are saved to the database immediately.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First name</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last name</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last name"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            defaultValue={initialData.email}
                            disabled
                        />
                        <p className="text-[0.8rem] text-muted-foreground">
                            Email cannot be changed here. Contact support to update your email address.
                        </p>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job title / Role</Label>
                        <Input
                            id="jobTitle"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g. Senior Engineer"
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Saving..." : "Save changes"}
                    </Button>
                </CardFooter>
            </Card>
        </form>
    )
}
