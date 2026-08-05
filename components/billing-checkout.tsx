"use client"

import { useEffect, useMemo, useState } from "react"
import { CheckCircle2Icon, CreditCardIcon, LoaderCircleIcon, ShieldCheckIcon } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type PlanCode = "blueprint" | "complete" | "counselor"
type BillingConfig = { provider: "test" | "stripe" | "iyzico"; requiresBillingDetails: boolean; ownerAccess: boolean; activePlans: Array<{ code: string; name: string; status: string }>; documents: Array<{ id: string; document_kind: string; provider: string; provider_reference: string | null; issued_at: string }> }

const studentPlans: Array<{ code: PlanCode; name: string; price: string; interval: string; description: string }> = [
  { code: "blueprint", name: "Project Blueprint", price: "₺1,200", interval: "one time", description: "Three tailored ideas, one complete blueprint, a weekly plan, and an evidence checklist." },
  { code: "complete", name: "Complete Student Portfolio", price: "₺5,500", interval: "one time", description: "Up to three projects, evidence, reflection, portfolio, presentation, and application-prep tools." },
]
const counselorPlans: Array<{ code: PlanCode; name: string; price: string; interval: string; description: string }> = [
  { code: "counselor", name: "Counselor Professional", price: "₺2,500", interval: "per month", description: "Up to 25 active students, factual reviews, reports, and reusable project templates." },
]

export function BillingCheckout({ audience, locale }: { audience: "student" | "counselor"; locale: string }) {
  const plans = audience === "student" ? studentPlans : counselorPlans
  const [config, setConfig] = useState<BillingConfig | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<PlanCode | null>(null)
  const [busy, setBusy] = useState(false)
  const [details, setDetails] = useState({ fullName: "", identityNumber: "", phone: "", address: "", city: "", country: "Türkiye", postalCode: "", district: "", payerAuthorized: false })

  useEffect(() => {
    void fetch("/api/billing/config").then(async (response) => {
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      setConfig(body)
    }).catch((error) => toast.error(error instanceof Error ? error.message : "Billing details could not be loaded."))
  }, [])

  const activeCodes = useMemo(() => new Set(config?.activePlans.map((plan) => plan.code) ?? []), [config])
  const requiresDetails = Boolean(config?.requiresBillingDetails)

  async function checkout(planCode: PlanCode) {
    if (requiresDetails && !details.payerAuthorized) return toast.error("Confirm that the billing details belong to the authorized payer.")
    setBusy(true)
    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ planCode, locale: locale === "tr" ? "tr" : "en", ...(requiresDetails ? { billing: details } : {}) }),
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error ?? "Checkout could not be started.")
      window.location.assign(body.url)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout could not be started.")
      setBusy(false)
    }
  }

  async function cancelCounselorSubscription() {
    setBusy(true)
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error)
      toast.success("Your Counselor Professional cancellation was recorded.")
      setConfig((current) => current ? { ...current, activePlans: current.activePlans.filter((plan) => plan.code !== "counselor") } : current)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The subscription could not be canceled.")
    } finally {
      setBusy(false)
    }
  }

  if (config?.ownerAccess) return <Alert><ShieldCheckIcon /><AlertTitle>Owner access has no checkout</AlertTitle><AlertDescription>Your owner tools are always available. Use the Owner Console to grant a customer complimentary, discounted, or manual access.</AlertDescription></Alert>

  return <div className="space-y-6">
    <Alert><ShieldCheckIcon /><AlertTitle>Clear, server-authorized access</AlertTitle><AlertDescription>{requiresDetails ? "The authorized payer’s details are sent directly to iyzico for its hosted checkout. PortfolioPath never stores card data, identity numbers, or billing addresses." : "This environment is using the safe test payment adapter. A real production checkout will require a configured provider."}</AlertDescription></Alert>
    {config?.activePlans.length ? <div className="flex flex-wrap gap-2">{config.activePlans.map((plan) => <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm text-success" key={plan.code}><CheckCircle2Icon className="size-4" />{plan.name}</span>)}</div> : null}
    <div className={`grid gap-5 ${plans.length > 1 ? "lg:grid-cols-2" : "max-w-2xl"}`}>
      {plans.map((plan) => {
        const active = activeCodes.has(plan.code)
        return <Card key={plan.code} className={plan.code === "complete" ? "border-accent" : ""}>
          <CardHeader><CardTitle>{plan.name}</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader>
          <CardContent><p className="text-3xl font-semibold text-primary">{plan.price}</p><p className="mt-1 text-sm text-muted-foreground">{plan.interval}</p></CardContent>
          <CardFooter><Button className="w-full" disabled={busy || active} variant={plan.code === "complete" ? "default" : "outline"} onClick={() => setSelectedPlan(plan.code)}>{active ? "Active" : "Choose plan"}</Button></CardFooter>
        </Card>
      })}
    </div>
    {selectedPlan ? <Card className="border-secondary/40"><CardHeader><CardTitle>{requiresDetails ? "Authorized payer details" : "Confirm checkout"}</CardTitle><CardDescription>{requiresDetails ? "Use the adult or organization legally responsible for this payment. These fields are used only to start iyzico’s hosted checkout." : "Continue to the safe test checkout. Live payment details are not requested in this environment."}</CardDescription></CardHeader>{requiresDetails ? <><CardContent><FieldGroup><Field><FieldLabel htmlFor="billing-name">Payer’s full name</FieldLabel><Input id="billing-name" value={details.fullName} onChange={(event) => setDetails({ ...details, fullName: event.target.value })} autoComplete="name" /></Field><Field><FieldLabel htmlFor="billing-id">Identity or tax ID</FieldLabel><Input id="billing-id" value={details.identityNumber} onChange={(event) => setDetails({ ...details, identityNumber: event.target.value })} autoComplete="off" /><FieldDescription>This is sent to iyzico only and is not stored by PortfolioPath.</FieldDescription></Field><Field><FieldLabel htmlFor="billing-phone">Phone</FieldLabel><Input id="billing-phone" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} autoComplete="tel" /></Field><Field><FieldLabel htmlFor="billing-address">Billing address</FieldLabel><Input id="billing-address" value={details.address} onChange={(event) => setDetails({ ...details, address: event.target.value })} autoComplete="street-address" /></Field><Field><FieldLabel htmlFor="billing-city">City</FieldLabel><Input id="billing-city" value={details.city} onChange={(event) => setDetails({ ...details, city: event.target.value })} autoComplete="address-level2" /></Field><Field><FieldLabel htmlFor="billing-district">District (optional)</FieldLabel><Input id="billing-district" value={details.district} onChange={(event) => setDetails({ ...details, district: event.target.value })} /></Field><Field><FieldLabel htmlFor="billing-country">Country</FieldLabel><Input id="billing-country" value={details.country} onChange={(event) => setDetails({ ...details, country: event.target.value })} autoComplete="country-name" /></Field><Field><FieldLabel htmlFor="billing-postal">Postal code</FieldLabel><Input id="billing-postal" value={details.postalCode} onChange={(event) => setDetails({ ...details, postalCode: event.target.value })} autoComplete="postal-code" /></Field></FieldGroup><label className="mt-5 flex items-start gap-3 text-sm"><Checkbox checked={details.payerAuthorized} onCheckedChange={(checked) => setDetails({ ...details, payerAuthorized: checked === true })} /><span>I am the authorized payer, or I have the payer’s permission to submit these billing details.</span></label></CardContent></> : null}<CardFooter className="flex flex-wrap gap-3 border-t"><Button variant="outline" disabled={busy} onClick={() => setSelectedPlan(null)}>Back</Button><Button disabled={busy} onClick={() => void checkout(selectedPlan)}>{busy ? <LoaderCircleIcon data-icon="inline-start" className="animate-spin" /> : <CreditCardIcon data-icon="inline-start" />}{requiresDetails ? "Continue to iyzico" : "Run test checkout"}</Button></CardFooter></Card> : null}
    {config?.documents.length ? <Card><CardHeader><CardTitle>Payment records</CardTitle><CardDescription>Receipts and invoice references are created only after a payment is confirmed by the provider.</CardDescription></CardHeader><CardContent className="flex flex-col gap-3">{config.documents.map((document) => <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3 last:border-0 last:pb-0" key={document.id}><div><p className="font-medium capitalize">{document.document_kind}</p><p className="text-sm text-muted-foreground">{new Date(document.issued_at).toLocaleDateString()} · {document.provider}</p></div><span className="text-xs text-muted-foreground">{document.provider_reference ?? "Provider reference pending"}</span></div>)}</CardContent></Card> : null}
    {audience === "counselor" && activeCodes.has("counselor") ? <Card><CardHeader><CardTitle>Cancel Counselor Professional</CardTitle><CardDescription>Cancellations are recorded by the server. Access and future billing are updated only after the payment provider confirms the change.</CardDescription></CardHeader><CardFooter><Button variant="outline" disabled={busy} onClick={() => void cancelCounselorSubscription()}>Cancel subscription</Button></CardFooter></Card> : null}
  </div>
}
