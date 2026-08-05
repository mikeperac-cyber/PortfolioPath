import { notFound } from "next/navigation"
import { SchoolWorkspace } from "@/components/partner-workspaces"

const sections = ["dashboard", "students", "templates", "subscription"]

export default async function SchoolPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!sections.includes(section)) notFound()
  return <SchoolWorkspace section={section} />
}
