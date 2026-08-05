import Link from "next/link"
export function Brand({ locale = "en", inverse = false }: { locale?: string; inverse?: boolean }) { return <Link href={`/${locale}`} className={`font-heading text-xl font-semibold tracking-tight ${inverse ? "text-sidebar-foreground" : "text-primary"}`}>Portfolio<span className="text-accent">Path</span></Link> }
