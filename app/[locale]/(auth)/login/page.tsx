import Link from "next/link"
import { Suspense } from "react"
import { AuthForm } from "@/components/auth-form"

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; return <><Suspense fallback={<div className="h-96 animate-pulse bg-muted"/>}><AuthForm mode="login"/></Suspense><p className="mt-5 text-center text-sm text-muted-foreground">New here? <Link className="font-medium text-secondary underline underline-offset-4" href={`/${locale}/register`}>Create an account</Link></p><div className="mt-6 border-t pt-5 text-xs leading-5 text-muted-foreground"><p className="font-medium text-foreground">Local demo accounts</p><p>student@demo.portfoliopath.example.com · counselor@demo.portfoliopath.example.com · admin@demo.portfoliopath.example.com</p><p>Password: Portfolio123!</p></div></> }
