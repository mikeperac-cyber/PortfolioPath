import { NextResponse } from "next/server"
import { getApiContext } from "@/lib/api-auth"

export async function GET() {
  const context = await getApiContext(["platform_owner"])
  if (context.error) return context.error
  const { data, error } = await context.supabase.rpc("owner_platform_insights")
  if (error) return NextResponse.json({ error: "Owner insights are not available yet." }, { status: 500 })
  return NextResponse.json(data)
}
