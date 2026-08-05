import { AppShell } from "@/components/app-shell"
import { requireRole } from "@/lib/auth"
export default async function StudentLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;const user=await requireRole("student",locale);return <AppShell user={user}>{children}</AppShell>}
