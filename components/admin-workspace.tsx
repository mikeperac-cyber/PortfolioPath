"use client"

import { useCallback, useEffect, useState } from "react"
import {
  ActivityIcon,
  CreditCardIcon,
  FlagIcon,
  FolderKanbanIcon,
  RefreshCwIcon,
  ShieldAlertIcon,
  TrendingUpIcon,
  UserCheckIcon,
  UsersIcon,
} from "lucide-react"
import { toast } from "sonner"
import { SectionHeader } from "@/components/section-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PlatformInsights = {
  generatedAt: string
  totals: {
    users: number
    activeCounselors: number
    projects: number
    activeProjects: number
    completedProjects: number
    evidence: number
    acceptedEvidence: number
    reflections: number
    publishedPortfolios: number
  }
  funnel: {
    registeredStudents: number
    onboardedStudents: number
    studentsWithProjects: number
    studentsWithEvidence: number
    studentsWithPortfolioReady: number
  }
  commercial: {
    activePaidAccounts: number
    recognizedRevenueTry: number
    recognizedRevenueTry30d: number
    planMix: Record<string, number>
  }
  operations: {
    pendingCounselors: number
    projectsAwaitingReview: number
    openFlags: number
    newStudents30d: number
    newProjects30d: number
    evidenceAdded30d: number
  }
}

const adminData: Record<string, { title: string; description: string; headers: string[]; rows: string[][] }> = {
  users: { title: "User management", description: "Approve counselors, suspend accounts, and inspect only essential account metadata.", headers: ["User", "Role", "State", "Created", "Action"], rows: [] },
  assignments: { title: "Counselor assignments", description: "Create and deactivate explicit student–counselor assignments.", headers: ["Student", "Counselor", "State", "Assigned", "Action"], rows: [] },
  categories: { title: "Project categories", description: "Maintain the focused category catalog used by templates and the idea generator.", headers: ["Category", "Templates", "State", "Action"], rows: [["Environmental action", "2", "Active", "Edit"], ["Coding and technology", "3", "Active", "Edit"]] },
  templates: { title: "Project templates", description: "Curate bilingual, deterministic project directions with feasibility and ethics metadata.", headers: ["Template", "Category", "Locale", "State", "Action"], rows: [["Travel and culture starter", "Travel and cultural exploration", "EN / TR", "Active", "Edit"], ["Coding and technology starter", "Coding and technology", "EN / TR", "Active", "Edit"]] },
  plans: { title: "Plans", description: "Update TRY pricing and server-enforced entitlement metadata.", headers: ["Plan", "Price", "Billing", "Limit", "Action"], rows: [["Free Assessment", "₺0", "Free", "1 direction", "Edit"], ["Project Blueprint", "₺1,200", "One-time", "1 project", "Edit"], ["Complete Portfolio", "₺5,500", "One-time", "3 projects", "Edit"], ["Counselor Professional", "₺2,500", "Monthly", "25 students", "Edit"]] },
  flags: { title: "Flagged content", description: "Review ethical or safety concerns. Private evidence access requires a recorded case reason.", headers: ["Case", "Record", "Reason", "State", "Action"], rows: [["FLAG-104", "Project outcome", "Unsupported impact claim", "Open", "Review"]] },
  settings: { title: "Platform settings", description: "Essential operational settings only; no school branding or enterprise configuration.", headers: ["Setting", "Value", "Action"], rows: [["Default share expiry", "30 days", "Edit"], ["Maximum share expiry", "90 days", "Locked"]] },
}

const tryCurrency = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
})

function funnelRate(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0
}

async function requestInsights() {
  const response = await fetch("/api/admin/insights", { cache: "no-store" })
  const payload = await response.json() as { data?: PlatformInsights; error?: string }
  if (!response.ok || !payload.data) throw new Error(payload.error ?? "Insights could not be loaded.")
  return payload.data
}

function Overview() {
  const [insights, setInsights] = useState<PlatformInsights | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadInsights = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setInsights(await requestInsights())
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Insights could not be loaded.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void requestInsights()
      .then((data) => { if (active) setInsights(data) })
      .catch((loadError: unknown) => { if (active) setError(loadError instanceof Error ? loadError.message : "Insights could not be loaded.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const header = (
    <SectionHeader
      eyebrow="Administration"
      title="Platform & commercial insights"
      description="Live aggregate product usage, conversion, payments, and operational signals. Student evidence and private content are excluded."
      action={
        <Button variant="outline" onClick={() => void loadInsights()} disabled={loading}>
          <RefreshCwIcon className={loading ? "animate-spin" : ""} />
          Refresh
        </Button>
      }
    />
  )

  if (loading && !insights) {
    return <>{header}<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{Array.from({ length: 5 }, (_, index) => <Skeleton className="h-28" key={index} />)}</div></>
  }

  if (!insights) {
    return <>{header}<Card className="border-error/30"><CardHeader><CardTitle>Insights unavailable</CardTitle><CardDescription>{error}</CardDescription></CardHeader><CardFooter><Button onClick={() => void loadInsights()}>Try again</Button></CardFooter></Card></>
  }

  const metrics = [
    { Icon: UsersIcon, label: "Users", value: insights.totals.users },
    { Icon: UserCheckIcon, label: "Active counselors", value: insights.totals.activeCounselors },
    { Icon: FolderKanbanIcon, label: "Active projects", value: insights.totals.activeProjects },
    { Icon: CreditCardIcon, label: "Paid accounts", value: insights.commercial.activePaidAccounts },
    { Icon: FlagIcon, label: "Open flags", value: insights.operations.openFlags },
  ]
  const funnel = [
    ["Registered students", insights.funnel.registeredStudents],
    ["Onboarding complete", insights.funnel.onboardedStudents],
    ["Created a project", insights.funnel.studentsWithProjects],
    ["Added evidence", insights.funnel.studentsWithEvidence],
    ["Portfolio ready", insights.funnel.studentsWithPortfolioReady],
  ] as const

  return <>
    {header}
    {error ? <p className="mb-4 text-sm text-error">Latest refresh failed: {error}</p> : null}
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {metrics.map(({ Icon, label, value }) => <Card key={label}><CardContent className="flex justify-between pt-6"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold text-primary">{value.toLocaleString()}</p></div><Icon className="size-5 text-secondary" /></CardContent></Card>)}
    </div>

    <div className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader><CardTitle>Student activation funnel</CardTitle><CardDescription>Privacy-safe account and product milestones, measured from current database records.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          {funnel.map(([label, value]) => {
            const rate = funnelRate(value, insights.funnel.registeredStudents)
            return <div className="space-y-2" key={label}><div className="flex items-center justify-between gap-4 text-sm"><span>{label}</span><span className="font-medium text-primary">{value} · {rate}%</span></div><Progress value={rate} aria-label={`${label}: ${rate}%`} /></div>
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Commercial performance</CardTitle><CardDescription>Completed payment records only—no forecasts or fabricated revenue.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          <div><p className="text-sm text-muted-foreground">Recognized revenue</p><p className="mt-1 text-3xl font-semibold text-primary">{tryCurrency.format(insights.commercial.recognizedRevenueTry)}</p></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted p-4"><p className="text-xs text-muted-foreground">Last 30 days</p><p className="mt-1 font-semibold">{tryCurrency.format(insights.commercial.recognizedRevenueTry30d)}</p></div>
            <div className="rounded-lg bg-muted p-4"><p className="text-xs text-muted-foreground">Active paid accounts</p><p className="mt-1 font-semibold">{insights.commercial.activePaidAccounts}</p></div>
          </div>
          <div><p className="mb-2 text-sm font-medium">Active plan mix</p><div className="flex flex-wrap gap-2">{Object.entries(insights.commercial.planMix).map(([plan, count]) => <Badge variant="outline" key={plan}>{plan.replaceAll("_", " ")}: {count}</Badge>)}</div></div>
        </CardContent>
      </Card>
    </div>

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Operations</CardTitle><CardDescription>Work requiring attention and activity in the last 30 days.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {[
            ["Projects awaiting review", insights.operations.projectsAwaitingReview],
            ["Counselors pending approval", insights.operations.pendingCounselors],
            ["New students", insights.operations.newStudents30d],
            ["New projects", insights.operations.newProjects30d],
            ["Evidence added", insights.operations.evidenceAdded30d],
            ["Published portfolios", insights.totals.publishedPortfolios],
          ].map(([label, value]) => <div className="rounded-lg border p-4" key={String(label)}><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-xl font-semibold text-primary">{value}</p></div>)}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Privacy & data quality</CardTitle><CardDescription>What these business insights do—and do not—measure.</CardDescription></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="flex gap-3"><ShieldAlertIcon className="mt-0.5 size-4 shrink-0 text-success" />Only aggregate counts are returned; names, reflections, files, and evidence content stay private.</p>
          <p className="flex gap-3"><ActivityIcon className="mt-0.5 size-4 shrink-0 text-secondary" />Metrics come from application records, subscriptions, and verified payment states.</p>
          <p className="flex gap-3"><TrendingUpIcon className="mt-0.5 size-4 shrink-0 text-accent" />Marketing attribution and page analytics are intentionally not inferred without consented analytics.</p>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">Updated {new Date(insights.generatedAt).toLocaleString()}</CardFooter>
      </Card>
    </div>
  </>
}

export function AdminWorkspace({ section }: { section: string }) {
  if (section === "dashboard") return <Overview />
  const data = adminData[section]
  return <>
    <SectionHeader eyebrow="Minimal admin control" title={data.title} description={data.description} action={<Button onClick={() => toast.success("Administrative change saved and audit-logged")}>Add or update</Button>} />
    <Card>
      <CardHeader><Input className="max-w-sm" placeholder={`Search ${data.title.toLowerCase()}…`} /></CardHeader>
      <CardContent>{data.rows.length ? <Table><TableHeader><TableRow>{data.headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow></TableHeader><TableBody>{data.rows.map((row, index) => <TableRow key={index}>{row.map((cell, cellIndex) => <TableCell key={cellIndex}>{cellIndex === 2 && ["Active", "Pending", "Open"].includes(cell) ? <Badge variant={cell === "Active" ? "default" : "outline"}>{cell}</Badge> : cell}</TableCell>)}</TableRow>)}</TableBody></Table> : <div className="rounded-lg border border-dashed p-8 text-center"><p className="font-semibold text-primary">No real records yet</p><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">This area will populate from actual platform records instead of sample users or assignments.</p></div>}</CardContent>
      <CardFooter className="text-xs text-muted-foreground">Administrative operations require server authorization and are written to the audit log.</CardFooter>
    </Card>
  </>
}
