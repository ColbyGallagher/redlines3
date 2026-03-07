"use client"

import { useState, useEffect } from "react"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Building2, ShieldCheck, Loader2 } from "lucide-react"
import { UserTable } from "@/components/admin/user-table"
import { AddUserDialog } from "@/components/admin/add-user-dialog"
import { getAllAdminUsers, getCompanies, getRoles, getCurrentUserRole, type UserWithCompany } from "@/lib/actions/users"

export default function AdminPage() {
    const [users, setUsers] = useState<UserWithCompany[]>([])
    const [companies, setCompanies] = useState<any[]>([])
    const [roles, setRoles] = useState<any[]>([])
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [usersData, companiesData, rolesData, currentRole] = await Promise.all([
                getAllAdminUsers(),
                getCompanies(),
                getRoles(),
                getCurrentUserRole()
            ])
            setUsers(usersData)
            setCompanies(companiesData)
            setRoles(rolesData)
            setCurrentUserRole(currentRole)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Admin</h2>
            </div>
            <Separator />
            <Tabs defaultValue="people" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="people" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        People
                    </TabsTrigger>
                    <TabsTrigger value="organization" className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Organization
                    </TabsTrigger>
                    <TabsTrigger value="security" className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="people" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Manage People</h3>
                            <p className="text-sm text-muted-foreground">
                                View and manage users, roles, and permissions across your organization.
                            </p>
                        </div>
                        <AddUserDialog companies={companies} roles={roles} currentUserRole={currentUserRole} onSuccess={loadData} />
                    </div>
                    <div className="rounded-lg border bg-card p-4">
                        {isLoading ? (
                            <div className="flex h-[400px] items-center justify-center">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <UserTable data={users} companies={companies} roles={roles} currentUserRole={currentUserRole} onRefresh={loadData} />
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="organization" className="space-y-4">
                    <div className="rounded-lg border bg-card p-8">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="rounded-full bg-primary/10 p-3">
                                <Building2 className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-semibold">Organization Settings</h3>
                                <p className="text-muted-foreground">
                                    Configure organization-wide settings, themes, and branding.
                                </p>
                            </div>
                            <div className="w-full max-w-2xl py-8">
                                <div className="text-sm text-muted-foreground italic">
                                    Organization settings configuration coming soon...
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="security" className="space-y-4">
                    <div className="rounded-lg border bg-card p-8">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center">
                            <div className="rounded-full bg-primary/10 p-3">
                                <ShieldCheck className="h-10 w-10 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-semibold">Security & Access</h3>
                                <p className="text-muted-foreground">
                                    Manage authentication methods, API keys, and audit logs.
                                </p>
                            </div>
                            <div className="w-full max-w-2xl py-8">
                                <div className="text-sm text-muted-foreground italic">
                                    Security settings coming soon...
                                </div>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
