import { AppShell } from "@/components/app-shell"
import { requireAnyRole } from "@/lib/auth"

export default async function SchoolLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const user = await requireAnyRole(["school_admin", "school_counselor"], locale)
  return <AppShell user={user} workspace="school">{children}</AppShell>
}
