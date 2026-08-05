import { AppShell } from "@/components/app-shell"
import { requireRole } from "@/lib/auth"
export default async function AdminLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;const user=await requireRole("administrator",locale);return <AppShell user={user}>{children}</AppShell>}
