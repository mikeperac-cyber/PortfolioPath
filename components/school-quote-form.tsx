"use client"

import { useState } from "react"
import { CheckCircle2Icon, LoaderCircleIcon } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function SchoolQuoteForm() {
  const [busy, setBusy] = useState(false)
  const [sent, setSent] = useState(false)
  const [values, setValues] = useState({ contactName: "", workEmail: "", organizationName: "", estimatedStudents: "", message: "" })
  function update(key: keyof typeof values, value: string) { setValues((current) => ({ ...current, [key]: value })) }
  async function submit() {
    setBusy(true)
    try {
      const response = await fetch("/api/school-quotes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...values, estimatedStudents: values.estimatedStudents ? Number(values.estimatedStudents) : undefined }) })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "Your request could not be sent.")
      setSent(true)
      toast.success("School partnership request received.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Your request could not be sent.")
    } finally { setBusy(false) }
  }
  if (sent) return <Card className="border-success/40"><CardContent className="flex flex-col items-start gap-3 p-7"><CheckCircle2Icon className="size-7 text-success" /><h2 className="text-xl font-semibold text-primary">Thank you—your request is recorded.</h2><p className="text-sm leading-6 text-muted-foreground">A school partnership is quote-led and annual. No account, payment, or student data has been created from this form.</p></CardContent></Card>
  return <Card><CardHeader><CardTitle>Request a school partnership conversation</CardTitle><CardDescription>Annual school plans are quoted after a short needs and privacy discussion. There is no self-serve enterprise checkout.</CardDescription></CardHeader><CardContent><FieldGroup><Field><FieldLabel htmlFor="quote-name">Your name</FieldLabel><Input id="quote-name" value={values.contactName} onChange={(event) => update("contactName", event.target.value)} /></Field><Field><FieldLabel htmlFor="quote-email">Work email</FieldLabel><Input id="quote-email" type="email" value={values.workEmail} onChange={(event) => update("workEmail", event.target.value)} /></Field><Field><FieldLabel htmlFor="quote-school">School or organization</FieldLabel><Input id="quote-school" value={values.organizationName} onChange={(event) => update("organizationName", event.target.value)} /></Field><Field><FieldLabel htmlFor="quote-students">Estimated students (optional)</FieldLabel><Input id="quote-students" type="number" min={1} max={10000} value={values.estimatedStudents} onChange={(event) => update("estimatedStudents", event.target.value)} /></Field><Field><FieldLabel htmlFor="quote-message">What would you like to discuss? (optional)</FieldLabel><Textarea id="quote-message" rows={4} value={values.message} onChange={(event) => update("message", event.target.value)} placeholder="Cohorts, counselor workflow, onboarding, or annual pricing…" /></Field></FieldGroup></CardContent><CardFooter><Button disabled={busy} onClick={() => void submit()}>{busy ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : null}Request a conversation</Button></CardFooter></Card>
}
