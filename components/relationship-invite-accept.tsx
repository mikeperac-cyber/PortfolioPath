"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle2Icon, HeartHandshakeIcon, LoaderCircleIcon, UserCheckIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

export function RelationshipInviteAccept({ token }: { token: string }) {
  const params = useParams<{ locale: string }>()
  const locale = params.locale === "tr" ? "tr" : "en"
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void createClient().auth.getUser().then(({ data }) => {
      setSignedIn(Boolean(data.user))
      setChecking(false)
    })
  }, [])

  async function accept() {
    setBusy(true)
    try {
      const response = await fetch("/api/relationships/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "This invitation could not be accepted.")
      toast.success("Connection accepted. Your access is now limited to the student who invited you.")
      router.push(`/${locale}/${body.workspace}/dashboard`)
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "This invitation could not be accepted.")
    } finally {
      setBusy(false)
    }
  }

  const next = encodeURIComponent(`/${locale}/invite/${token}`)
  return <Card className="w-full max-w-xl shadow-sm"><CardHeader><div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-accent/15 text-accent"><HeartHandshakeIcon className="size-6" /></div><CardTitle>Private PortfolioPath invitation</CardTitle><CardDescription>This connection is limited to the student who invited you. It never gives access to their private journal by default.</CardDescription></CardHeader><CardContent className="space-y-4 text-sm leading-6 text-muted-foreground"><p>Parents see consented project progress, selected evidence, and shared counselor updates. Mentors receive only specific factual verification requests.</p><p className="flex items-start gap-2 text-foreground"><UserCheckIcon className="mt-0.5 size-4 text-secondary" />You should accept only if you recognise the student and the email address receiving this invitation.</p></CardContent><CardFooter>{checking ? <Button disabled><LoaderCircleIcon data-icon="inline-start" className="animate-spin" />Checking account</Button> : signedIn ? <Button disabled={busy} onClick={() => void accept()}>{busy ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <CheckCircle2Icon data-icon="inline-start" />}Accept private invitation</Button> : <div className="flex flex-wrap gap-3"><Button asChild><Link href={`/${locale}/login?next=${next}`}>Log in to accept</Link></Button><Button asChild variant="outline"><Link href={`/${locale}/register?next=${next}`}>Create account</Link></Button></div>}</CardFooter></Card>
}
