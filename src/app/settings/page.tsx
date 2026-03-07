"use client"

import { Separator } from "@/components/ui/separator"
import { Settings, User, Bell, Palette } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
            </div>
            <Separator />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex flex-col space-y-2">
                        <User className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-semibold">Account</h3>
                        <p className="text-sm text-muted-foreground">
                            Manage your profile, email, and password.
                        </p>
                    </div>
                </div>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex flex-col space-y-2">
                        <Bell className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-semibold">Notifications</h3>
                        <p className="text-sm text-muted-foreground">
                            Configure how you receive alerts and updates.
                        </p>
                    </div>
                </div>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex flex-col space-y-2">
                        <Palette className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-semibold">Appearance</h3>
                        <p className="text-sm text-muted-foreground">
                            Customize the look and feel of the application.
                        </p>
                    </div>
                </div>
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="flex flex-col space-y-2">
                        <Settings className="h-8 w-8 text-primary" />
                        <h3 className="text-xl font-semibold">Preferences</h3>
                        <p className="text-sm text-muted-foreground">
                            General application preferences and defaults.
                        </p>
                    </div>
                </div>
            </div>
            <div className="mt-8 rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground italic">
                    Detailed settings configurations coming soon...
                </p>
            </div>
        </div>
    )
}
