"use client"

import { useEffect, useState } from "react"
import { CopyIcon, HeartHandshakeIcon, LoaderCircleIcon, MailPlusIcon, UserCheckIcon } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Connection = { id: string; name: string; created_at: string }

export function RelationshipManager() {
  const [role, setRole] = useState<"parent" | "mentor">("parent")
  const [email, setEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [parents, setParents] = useState<Connection[]>([])
  const [mentors, setMentors] = useState<Connection[]>([])
  const [inviteUrl, setInviteUrl] = useState("")

  const load = () => void fetch("/api/relationships", { cache: "no-store" }).then(async (response) => {
    const body = await response.json()
    if (!response.ok) throw new Error(body.error ?? "Connections could not be loaded.")
    setParents(body.parents ?? [])
    setMentors(body.mentors ?? [])
  }).catch((error) => toast.error(error instanceof Error ? error.message : "Connections could not be loaded."))

  useEffect(load, [])

  async function invite() {
    if (!email.trim()) return toast.error("Enter the parent or mentor's email address.")
    setBusy(true)
    try {
      const response = await fetch("/api/relationships/invite", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role, email }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "Invitation could not be created.")
      setInviteUrl(body.invitation.url)
      setEmail("")
      toast.success("Private invitation created. Share it only with the intended person.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Invitation could not be created.")
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      toast.success("Private invitation link copied.")
    } catch {
      toast.error("Copy the invitation link manually.")
    }
  }

  return <Card><CardHeader><div className="flex items-start justify-between gap-4"><div><CardTitle>Invite a parent or mentor</CardTitle><CardDescription>Connections are consent-based. Parents do not see private reflections; mentors see only a specific request you create later.</CardDescription></div><HeartHandshakeIcon className="size-5 shrink-0 text-secondary" /></div></CardHeader><CardContent className="space-y-5"><FieldGroup><Field><FieldLabel>Connection type</FieldLabel><Select value={role} onValueChange={(value) => setRole(value as "parent" | "mentor")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="parent">Parent / guardian</SelectItem><SelectItem value="mentor">Mentor / verifier</SelectItem></SelectContent></Select></Field><Field><FieldLabel htmlFor="relationship-email">Their email address</FieldLabel><Input id="relationship-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" /></Field></FieldGroup>{inviteUrl ? <Alert><MailPlusIcon /><AlertTitle>One-time private invitation</AlertTitle><AlertDescription className="mt-2 flex flex-col items-start gap-3"><span className="break-all text-xs">{inviteUrl}</span><Button size="sm" variant="outline" onClick={() => void copy()}><CopyIcon data-icon="inline-start" />Copy link</Button></AlertDescription></Alert> : null}<div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border p-4"><p className="flex items-center gap-2 text-sm font-medium"><HeartHandshakeIcon className="size-4 text-secondary" />Parents</p><p className="mt-2 text-2xl font-semibold text-primary">{parents.length}</p><p className="mt-1 text-xs text-muted-foreground">Active consented connection{parents.length === 1 ? "" : "s"}</p></div><div className="rounded-lg border p-4"><p className="flex items-center gap-2 text-sm font-medium"><UserCheckIcon className="size-4 text-secondary" />Mentors</p><p className="mt-2 text-2xl font-semibold text-primary">{mentors.length}</p><p className="mt-1 text-xs text-muted-foreground">Available for factual verification</p></div></div>{parents.length || mentors.length ? <div className="flex flex-wrap gap-2">{parents.map((parent) => <Badge key={parent.id} variant="outline">Parent: {parent.name}</Badge>)}{mentors.map((mentor) => <Badge key={mentor.id} variant="outline">Mentor: {mentor.name}</Badge>)}</div> : null}</CardContent><CardFooter><Button disabled={busy} onClick={() => void invite()}>{busy ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <MailPlusIcon data-icon="inline-start" />}Create private invitation</Button></CardFooter></Card>
}
