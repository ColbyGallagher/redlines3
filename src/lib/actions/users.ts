"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import type { User, Role, Company, UserCompany } from "@/lib/db/types"

export type AdminUserState = {
    success?: boolean
    message?: string
}

export type UserWithCompany = User & {
    company_name: string | null
    role_name: string | null
    company_id: string | null
    role_id: string | null
}

export async function getAllAdminUsers(): Promise<UserWithCompany[]> {
    const supabase = await createServerSupabaseClient()

    try {
        // Query users and join with user_companies, companies, and roles
        const { data, error } = await (supabase.from("users") as any)
            .select(`
                *,
                user_companies!user_companies_user_id_fkey (
                    company_id,
                    role_id,
                    companies!user_companies_company_id_fkey (name),
                    roles!user_companies_role_id_fkey (name)
                )
            `)
            .order("first_name")

        if (error) {
            console.error("Error fetching admin users:", error)
            throw new Error(error.message)
        }

        return (data || []).map((user: any) => {
            const userCompany = user.user_companies?.[0] || {}
            return {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                language: user.language,
                job_title: user.job_title,
                company_name: userCompany.companies?.name || null,
                role_name: userCompany.roles?.name || null,
                company_id: userCompany.company_id || null,
                role_id: userCompany.role_id || null,
            }
        })
    } catch (error) {
        console.error("Unexpected error fetching users:", error)
        return []
    }
}

export async function getCompanies(): Promise<Company[]> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("companies").select("*").order("name")
    if (error) return []
    return data || []
}

export async function getRoles(): Promise<Role[]> {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.from("roles").select("*").order("name")
    if (error) return []
    return data || []
}

export async function getCurrentUserRole(): Promise<string | null> {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    // Fetch all active company associations with role names
    const { data, error } = await (supabase.from("user_companies") as any)
        .select(`
            roles:role_id (
                name
            )
        `)
        .eq("user_id", user.id)
        .eq("active", true)

    if (error || !data || !Array.isArray(data)) {
        console.error("Error fetching user role:", error)
        return null
    }

    // Extract all role names (handling potential array or object return from Supabase join)
    const roleNames = data
        .map((uc: any) => {
            const roleData = uc.roles
            if (Array.isArray(roleData)) return roleData[0]?.name
            return roleData?.name
        })
        .filter(Boolean)
        .map((n: string) => n.toLowerCase())

    // If they have 'developer' in any company, they are a developer
    if (roleNames.includes('developer')) return 'developer'

    // Otherwise return their first role name
    return roleNames[0] || null
}

export async function bulkAddUsers(usersToAdd: {
    first_name: string
    last_name: string
    email: string
    company_id?: string
    role_id?: string
}[]): Promise<AdminUserState> {
    const supabase = await createServerSupabaseClient()

    try {
        for (const user of usersToAdd) {
            // 1. Check if user already exists
            const { data: existingUser } = await (supabase
                .from("users") as any)
                .select("id")
                .eq("email", user.email)
                .maybeSingle()

            let userId = existingUser?.id

            if (!userId) {
                // 2. Insert user
                const { data: newUser, error: userError } = await (supabase
                    .from("users") as any)
                    .insert({
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email,
                    })
                    .select("id")
                    .single()

                if (userError) throw userError
                userId = newUser.id
            }

            // 3. Associate with company and role
            if (user.company_id) {
                const { error: assocError } = await (supabase
                    .from("user_companies") as any)
                    .upsert({
                        user_id: userId,
                        company_id: user.company_id,
                        role_id: user.role_id || null,
                        active: true
                    }, { onConflict: "user_id, company_id" } as any)

                if (assocError) throw assocError
            }
        }

        revalidatePath("/admin")
        return { success: true, message: `Successfully processed ${usersToAdd.length} users.` }
    } catch (error: any) {
        console.error("Error in bulkAddUsers:", error)
        return { success: false, message: error.message || "Failed to add users." }
    }
}

export async function updateUser(
    userId: string,
    updates: {
        first_name: string
        last_name: string
        email: string
        company_id?: string
        role_id?: string
    }
): Promise<AdminUserState> {
    const supabase = await createServerSupabaseClient()

    try {
        // 1. Update user details
        const { error: userError } = await (supabase
            .from("users") as any)
            .update({
                first_name: updates.first_name,
                last_name: updates.last_name,
                email: updates.email,
            })
            .eq("id", userId)

        if (userError) throw userError

        // 2. Update company/role association
        if (updates.company_id) {
            const { error: assocError } = await (supabase
                .from("user_companies") as any)
                .upsert({
                    user_id: userId,
                    company_id: updates.company_id,
                    role_id: updates.role_id || null,
                    active: true
                }, { onConflict: "user_id, company_id" } as any)

            if (assocError) throw assocError
        }

        revalidatePath("/admin")
        return { success: true, message: "User updated successfully." }
    } catch (error: any) {
        console.error("Error updating user:", error)
        return { success: false, message: error.message || "Failed to update user." }
    }
}

export async function deleteUsers(userIds: string[]): Promise<AdminUserState> {
    const supabase = await createServerSupabaseClient()

    try {
        // user_companies should have CASCADE delete, but let's be safe if it doesn't
        await supabase.from("user_companies").delete().in("user_id", userIds)

        const { error } = await supabase.from("users").delete().in("id", userIds)

        if (error) throw error

        revalidatePath("/admin")
        return { success: true, message: "Users deleted successfully." }
    } catch (error: any) {
        console.error("Error deleting users:", error)
        return { success: false, message: error.message || "Failed to delete users." }
    }
}
