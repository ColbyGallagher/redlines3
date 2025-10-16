import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withAuth } from "@/lib/supabase/middleware"

const PUBLIC_PATHS = ["/", "/login"]

export async function middleware(req: NextRequest) {
  const url = new URL(req.url)
  const pathname = url.pathname

  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  const { session, res } = await withAuth(req)

  // If on login and already authenticated, send to dashboard
  if (pathname.startsWith("/login") && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  if (!isPublic && !session) {
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}


