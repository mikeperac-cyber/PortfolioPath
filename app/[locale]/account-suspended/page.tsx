import Link from "next/link"
import { AlertTriangleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
export default function SuspendedPage(){return <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-5 px-5 text-center"><AlertTriangleIcon className="size-10 text-destructive"/><h1 className="text-3xl font-semibold">Account suspended</h1><p className="text-muted-foreground">Access is temporarily unavailable. Contact PortfolioPath support if you believe this is an error.</p><Button asChild><Link href="/en">Return home</Link></Button></main>}
