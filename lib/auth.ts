import { cache } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export type AppRole = "student" | "counselor" | "administrator"
export type CurrentUser = { id: string; role: AppRole; status: "active" | "pending" | "suspended"; full_name: string; locale: "en" | "tr" }

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const id = claims?.claims?.sub
  if (!id) return null
  const { data } = await supabase.from("users").select("id, role, status, full_name, locale").eq("id", id).single()
  return data as CurrentUser | null
})

export async function requireUser(locale = "en") {
  const user = await getCurrentUser()
  if (!user) redirect(`/${locale}/login`)
  if (user.status === "suspended") redirect(`/${locale}/account-suspended`)
  return user
}

export async function requireRole(role: AppRole, locale = "en") {
  const user = await requireUser(locale)
  if (user.role !== role) redirect(`/${locale}/${user.role === "administrator" ? "admin" : user.role}/dashboard`)
  if (role === "counselor" && user.status !== "active") redirect(`/${locale}/counselor/pending`)
  return user
}
