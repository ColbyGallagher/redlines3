import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies as nextCookies } from "next/headers"
import type { SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export type SupabaseServerClient<TDatabase = Record<string, never>> = SupabaseClient<TDatabase, "public", any>

type CookieAdapter = {
  get: (name: string) => { name: string; value: string } | undefined
  set: (
    name: string,
    value: string,
    options?: { path?: string; maxAge?: number; httpOnly?: boolean; secure?: boolean; sameSite?: "lax" | "strict" | "none" },
  ) => void
  remove: (name: string, options?: { path?: string }) => void
}

async function createDefaultCookieAdapter(): Promise<CookieAdapter> {
  const store = await nextCookies()

  return {
    get(name) {
      const cookie = store.get(name)
      return cookie ? { name, value: cookie.value } : undefined
    },
    set(name, value, options) {
      store.set(name, value, options)
    },
    remove(name) {
      store.delete(name)
    },
  }
}

export async function createServerSupabaseClient<TDatabase = Record<string, never>>(
  adapter?: CookieAdapter,
): Promise<SupabaseServerClient<TDatabase>> {
  const cookies = adapter ?? (await createDefaultCookieAdapter())

  return createServerClient<TDatabase>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        cookies.set(name, value, options)
      },
      remove(name: string, options: any) {
        cookies.remove(name, options)
      },
    },
    db: {
      schema: "redlines",
    },
  })
}

// Convenience wrapper for server components/routes where cookies() is available
export function createServerSupabaseClientFromHeaders<TDatabase = Record<string, never>>() {
  return createServerSupabaseClient<TDatabase>()
}


