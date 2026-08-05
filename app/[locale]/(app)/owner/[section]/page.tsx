import { notFound } from "next/navigation"
import { OwnerWorkspace } from "@/components/owner-workspace"

const sections = new Set(["dashboard", "customers", "organizations", "safety", "sandbox"])

export default async function OwnerPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params
  if (!sections.has(section)) notFound()
  return <OwnerWorkspace section={section} />
}
