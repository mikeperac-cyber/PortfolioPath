import { AppShell } from "@/components/app-shell"
import { requireRole } from "@/lib/auth"
export default async function CounselorLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}){const {locale}=await params;const user=await requireRole("counselor",locale);return <AppShell user={user}>{children}</AppShell>}
