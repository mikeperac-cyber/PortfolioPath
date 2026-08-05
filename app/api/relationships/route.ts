import { NextResponse } from "next/server"
import { getApiContext } from "@/lib/api-auth"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  const context = await getApiContext(["student"])
  if (context.error) return context.error
  const admin = createAdminClient()
  const [{ data: parents, error: parentError }, { data: mentors, error: mentorError }] = await Promise.all([
    admin.from("parent_student_links").select("id,parent_user_id,permissions,created_at").eq("student_id", context.user.id).is("revoked_at", null).order("created_at", { ascending: false }),
    admin.from("mentor_student_links").select("id,mentor_user_id,status,created_at").eq("student_id", context.user.id).order("created_at", { ascending: false }),
  ])
  if (parentError || mentorError) return NextResponse.json({ error: "Relationship information could not be loaded." }, { status: 500 })
  const connectionIds = [...(parents ?? []).map((link) => link.parent_user_id), ...(mentors ?? []).map((link) => link.mentor_user_id)]
  const { data: people, error: peopleError } = connectionIds.length ? await admin.from("users").select("id,full_name").in("id", connectionIds) : { data: [], error: null }
  if (peopleError) return NextResponse.json({ error: "Relationship information could not be loaded." }, { status: 500 })
  const names = new Map((people ?? []).map((person) => [person.id, person.full_name || "Connected account"]))
  return NextResponse.json({
    parents: (parents ?? []).map((link) => ({ ...link, name: names.get(link.parent_user_id) ?? "Connected parent" })),
    mentors: (mentors ?? []).map((link) => ({ ...link, name: names.get(link.mentor_user_id) ?? "Connected mentor" })),
  })
}
