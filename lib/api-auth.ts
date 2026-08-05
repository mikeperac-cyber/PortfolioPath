import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentUser, hasRole, type AppRole, type CurrentUser, type PlatformRole } from "@/lib/auth"

export async function getApiContext(roles?: Array<AppRole | PlatformRole>) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return { error: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) }
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const id = claims?.claims?.sub
  if (!id) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) }
  const profile = await getCurrentUser()
  const email = typeof claims.claims.email === "string" ? claims.claims.email : ""
  const user = profile ? { ...profile, email } : null
  if (!user || user.status !== "active") return { error: NextResponse.json({ error: "Account is not active." }, { status: 403 }) }
  if (roles && !roles.some((role) => hasRole(user as CurrentUser, role))) return { error: NextResponse.json({ error: "You do not have permission for this action." }, { status: 403 }) }
  return { supabase, user }
}

export function invalid(error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 }) }
