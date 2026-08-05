import { AppShell } from "@/components/app-shell"
import { requireRole } from "@/lib/auth"

export default async function OwnerLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const user = await requireRole("platform_owner", locale)
  return <AppShell user={user} workspace="owner">{children}</AppShell>
}
