import { NextResponse } from "next/server"
import { getApiContext, invalid } from "@/lib/api-auth"

export async function GET() {
  try {
    const context = await getApiContext(["administrator"])
    if (context.error) return context.error

    const { data, error } = await context.supabase.rpc("admin_platform_insights")
    if (error) throw error

    return NextResponse.json(
      { data },
      { headers: { "Cache-Control": "private, no-store" } },
    )
  } catch (error) {
    return invalid(error)
  }
}
