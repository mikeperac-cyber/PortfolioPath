import { AppShell } from "@/components/app-shell"
import { requireRole } from "@/lib/auth"

export default async function ParentLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const user = await requireRole("parent", locale)
  return <AppShell user={user} workspace="parent">{children}</AppShell>
}
