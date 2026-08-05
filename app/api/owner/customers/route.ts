import { NextResponse } from "next/server"
import { getApiContext } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const context = await getApiContext(["platform_owner"])
  if (context.error) return context.error
  const { data, error } = await createAdminClient()
    .from("users")
    .select("id,full_name,role,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: "Customers could not be loaded." }, { status: 500 })
  return NextResponse.json({ customers: data ?? [] })
}
