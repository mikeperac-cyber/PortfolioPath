import Link from "next/link"
import { Suspense } from "react"
import { AuthForm } from "@/components/auth-form"

export default async function RegisterPage({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; return <><Suspense fallback={<div className="h-96 animate-pulse bg-muted"/>}><AuthForm mode="register"/></Suspense><p className="mt-5 text-center text-sm text-muted-foreground">Already registered? <Link className="font-medium text-secondary underline underline-offset-4" href={`/${locale}/login`}>Log in</Link></p></> }
