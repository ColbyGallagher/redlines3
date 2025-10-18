import "server-only"

import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies as nextCookies } from "next/headers"

import type { Database } from "@/lib/db/types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type CookieAdapter = {
  get: (name: string) => { name: string; value: string } | undefined
  set: (
    name: string,
    value: string,
    options?: CookieOptions,
  ) => void
  remove: (name: string, options?: CookieOptions) => void
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
    remove(name, options) {
      void options
      store.delete(name)
    },
  }
}

export async function createServerSupabaseClient(
  adapter?: CookieAdapter,
) {
  const cookies = adapter ?? (await createDefaultCookieAdapter())

  return createServerClient<Database, "redlines">(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        cookies.set(name, value, options)
      },
      remove(name: string, options: CookieOptions) {
        cookies.remove(name, options)
      },
    },
    db: {
      schema: "redlines",
    },
  })
}

// Convenience wrapper for server components/routes where cookies() is available
export function createServerSupabaseClientFromHeaders() {
  return createServerSupabaseClient()
}


