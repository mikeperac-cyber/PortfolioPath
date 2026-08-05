import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { CurrentUser } from "@/lib/auth"

export async function getApiContext(roles?: CurrentUser["role"][]) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return { error: NextResponse.json({ error: "Supabase is not configured." }, { status: 503 }) }
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const id = claims?.claims?.sub
  if (!id) return { error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) }
  const { data, error } = await supabase.from("users").select("id,role,status,full_name,locale").eq("id", id).single()
  if (error) return { error: NextResponse.json({ error: "Could not verify the account." }, { status: 500 }) }
  const profile = data as CurrentUser | null
  const email = typeof claims.claims.email === "string" ? claims.claims.email : ""
  const user = profile ? { ...profile, email } : null
  if (!user || user.status !== "active") return { error: NextResponse.json({ error: "Account is not active." }, { status: 403 }) }
  if (roles && !roles.includes(user.role)) return { error: NextResponse.json({ error: "You do not have permission for this action." }, { status: 403 }) }
  return { supabase, user }
}

export function invalid(error: unknown) { return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid request." }, { status: 400 }) }
