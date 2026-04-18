import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const protectedPaths =
    pathname.startsWith("/dashboard") || pathname.startsWith("/superadmin")

  if (protectedPaths) {
    const cookies = request.cookies.getAll()

    // Supabase v2 menyimpan session dengan berbagai nama cookie
    const hasSession = cookies.some(
      (cookie) =>
        cookie.name.includes("sb-") ||
        cookie.name.includes("supabase") ||
        cookie.name.includes("access-token") ||
        cookie.name.includes("auth-token")
    )

    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/superadmin/:path*", "/superadmin"],
}
