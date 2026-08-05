import { NextResponse, type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/proxy"

const locales = new Set(["en", "tr"])

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const first = pathname.split("/")[1]
  if (!locales.has(first) && !pathname.startsWith("/api") && !pathname.startsWith("/share")) {
    const url = request.nextUrl.clone()
    url.pathname = `/en${pathname === "/" ? "" : pathname}`
    return NextResponse.redirect(url)
  }
  return updateSession(request)
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"] }
