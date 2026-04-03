import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // hanya protect dashboard
  if (pathname.startsWith("/dashboard")) {
    const hasSession = request.cookies
      .getAll()
      .some((cookie) => cookie.name.includes("sb-access-token"))

    // ❌ belum login → ke login
    if (!hasSession) {
      return NextResponse.redirect(new URL("/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}