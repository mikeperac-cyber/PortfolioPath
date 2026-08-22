/* eslint-disable @typescript-eslint/no-unused-vars */
import Link from "next/link"
import Image from "next/image"
import { ArrowRightIcon, CheckCircle2Icon, FileCheck2Icon, FolderLockIcon, ListChecksIcon, ShieldCheckIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MarketingHeader } from "@/components/marketing-header"
import { SiteFooter } from "@/components/site-footer"

const steps = [
  [ListChecksIcon, "Explore and plan", "Choose a feasible idea and define measurable outcomes."],
  [CheckCircle2Icon, "Build and document", "Complete weekly work and keep evidence as you go."],
  [FileCheck2Icon, "Reflect and verify", "Explain decisions and receive factual counselor review."],
  [FolderLockIcon, "Share with control", "Export a portfolio or create a revocable private link."],
] as const

export async function LandingPage({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "hero" })
  return <><MarketingHeader locale={locale}/><main id="main">
      <section className="bg-card border-y">
        <div className="mx-auto max-w-7xl px-5 py-24 lg:px-8">
          <div className="grid gap-16 lg:grid-cols-2 items-center">
            <div className="flex flex-col gap-8">
              <div>
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">US College Admissions</Badge>
                <h2 className="text-4xl font-semibold text-primary leading-tight">Designed for the Common App</h2>
                <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
                  US universities want to see sustained commitment and verifiable impact. PortfolioPath structures your projects to match exactly what top-tier admissions officers look for.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success shadow-sm">
                    <ListChecksIcon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Activity List Ready</h3>
                    <p className="text-muted-foreground text-sm mt-1">Export hours, roles, and descriptions formatted to fit the strict 150-character limit perfectly, automatically extracting your best verified metrics.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary shadow-sm">
                    <FileCheck2Icon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Supplemental Essay Source</h3>
                    <p className="text-muted-foreground text-sm mt-1">Use your weekly reflections and evidence to write authentic, detail-rich essays instead of struggling to remember what you did months ago.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent shadow-sm">
                    <ShieldCheckIcon className="size-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Counselor Recommendations</h3>
                    <p className="text-muted-foreground text-sm mt-1">Give your recommender factual evidence and confirmed skills, ensuring their letter contains specific, verifiable examples of your impact.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Background decorative elements */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/5 to-transparent rounded-3xl -z-10 blur-xl"></div>

              {/* Main App Mockup */}
              <div className="rounded-2xl border bg-background shadow-xl overflow-hidden relative">
                <div className="bg-muted/50 border-b px-4 py-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="size-3 rounded-full bg-destructive/50"></div>
                    <div className="size-3 rounded-full bg-accent/50"></div>
                    <div className="size-3 rounded-full bg-success/50"></div>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground mx-auto">Export to Common App</span>
                </div>

                <div className="p-6 md:p-8 space-y-6">
                  {/* Data Vis / Impact Stat */}
                  <div className="flex gap-4 items-center p-4 rounded-xl bg-primary/5 border border-primary/10 mb-6">
                    <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <span className="font-bold text-xl text-primary">3.2x</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-primary">Higher Credibility Score</p>
                      <p className="text-xs text-muted-foreground mt-1">Verified projects are rated significantly more credible by admissions readers than self-reported claims.*</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Activity Type</p>
                    <Select disabled defaultValue="research">
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Research / Independent Project" />
                      </SelectTrigger>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Position/Leadership</p>
                    <Input disabled value="Founder/Lead, Community Oral History Archive" className="h-9" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Hrs / Week</p>
                      <Input disabled value="4" className="h-9" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Wks / Year</p>
                      <Input disabled value="20" className="h-9" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Details, Honors, and Accomplishments</p>
                      <span className="text-[10px] text-success font-medium flex items-center gap-1"><CheckCircle2Icon className="size-3" /> 148/150 chars</span>
                    </div>
                    <div className="relative">
                      <Textarea disabled value="Interviewed 12 local elders. Transcribed 40 hours of audio. Built digital archive preserving neighborhood history. Confirmed by school counselor." className="resize-none h-24 text-sm" />
                      <div className="absolute -right-3 -top-3">
                        <div className="bg-success text-primary-foreground p-1.5 rounded-full shadow-lg">
                          <CheckCircle2Icon className="size-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground/60 italic">*Based on independent counselor surveys regarding verifiable vs unverified claims.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      <section className="bg-card border-y border-muted">
        <div className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold text-primary">Interactive Project Sandbox</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Explore what a completed, verified portfolio looks like before you sign up.
            </p>
          </div>

          <div className="rounded-xl border bg-background shadow-lg overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar / Navigation */}
            <div className="bg-muted/30 w-full md:w-64 p-6 border-r flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheckIcon className="size-5 text-success" />
                <span className="font-semibold text-sm">Verified Portfolio</span>
              </div>
              <button className="text-left px-3 py-2 rounded-md bg-background shadow-sm border text-sm font-medium text-primary">Executive Summary</button>
              <button className="text-left px-3 py-2 rounded-md hover:bg-background/50 text-sm font-medium text-muted-foreground transition-colors">Field Notes & Evidence</button>
              <button className="text-left px-3 py-2 rounded-md hover:bg-background/50 text-sm font-medium text-muted-foreground transition-colors">Counselor Attestations</button>
              <button className="text-left px-3 py-2 rounded-md hover:bg-background/50 text-sm font-medium text-muted-foreground transition-colors">Common App Export</button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-semibold">Community Oral History Archive</h3>
                  <p className="text-muted-foreground mt-1">Preserving neighborhood history through 12 elder interviews.</p>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                    <CheckCircle2Icon className="mr-1 size-3" /> Counselor Verified
                  </Badge>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Project Timeline</h4>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex-1 h-2 bg-success rounded-full"></div>
                    <span className="text-muted-foreground font-medium">8 Weeks Complete</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex justify-between">
                        Audio Transcripts
                        <FileCheck2Icon className="size-4 text-muted-foreground" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">40 hours of raw interview audio cleanly transcribed and coded by theme.</p>
                      <div className="mt-4 pt-4 border-t flex justify-between items-center">
                        <span className="text-xs font-medium text-accent">Self-Reported Evidence</span>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">View Files</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-success/30 bg-success/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex justify-between">
                        Methodology Review
                        <ShieldCheckIcon className="size-4 text-success" />
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">&quot;Student demonstrated exceptional rigor in securing consent and structuring interview questions.&quot;</p>
                      <div className="mt-4 pt-4 border-t border-success/20 flex justify-between items-center">
                        <span className="text-xs font-medium text-success flex items-center gap-1">
                          <CheckCircle2Icon className="size-3" /> Counselor Attestation
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

</main><SiteFooter locale={locale}/></>
}
