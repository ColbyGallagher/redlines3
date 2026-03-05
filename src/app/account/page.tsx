import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { AccountProfileForm } from "@/components/account/account-profile-form"

export default async function AccountPage() {
    const supabase = await createServerSupabaseClient()

    const {
        data: { user },
        error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
        redirect("/login")
    }

    // Load profile from the users table, fall back to auth metadata if not yet saved
    const { data: profile } = await (supabase.from("users") as any)
        .select("first_name, last_name, email, job_title")
        .eq("id", user.id)
        .single()

    const initialData = {
        firstName: profile?.first_name ?? user.user_metadata?.first_name ?? "",
        lastName: profile?.last_name ?? user.user_metadata?.last_name ?? "",
        email: user.email ?? "",
        jobTitle: profile?.job_title ?? "",
    }

    return (
        <div className="flex-1 space-y-6 p-8 pt-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Account Settings</h2>
                <p className="text-muted-foreground mt-1">
                    Manage your personal profile and preferences.
                </p>
            </div>

            <div className="grid gap-6 max-w-2xl">
                <AccountProfileForm initialData={initialData} />
            </div>
        </div>
    )
}
