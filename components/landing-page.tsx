import Link from "next/link"
import Image from "next/image"
import { ArrowRightIcon, CheckCircle2Icon, FileCheck2Icon, FolderLockIcon, ListChecksIcon, ShieldCheckIcon } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
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
  return <><MarketingHeader locale={locale}/><main id="main"><section className="bg-card"><div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-14 px-5 py-18 md:grid-cols-[1.04fr_.96fr] lg:px-8"><div className="flex flex-col items-start gap-7"><h1 className="max-w-4xl text-4xl leading-[1.08] font-semibold text-primary md:text-6xl">{t("title")}</h1><p className="max-w-2xl text-lg leading-8 text-muted-foreground">{t("body")}</p><div className="flex flex-wrap gap-3"><Button size="lg" asChild><Link href={`/${locale}/register?role=student`}>{t("student")}<ArrowRightIcon data-icon="inline-end"/></Link></Button><Button size="lg" variant="outline" asChild><Link href={`/${locale}/counselors`}>{t("counselor")}<ArrowRightIcon data-icon="inline-end"/></Link></Button></div><p className="text-sm text-muted-foreground">No invented leadership. No manufactured impact. No admissions guarantees.</p></div><div className="border bg-background p-7 md:p-9"><div className="flex items-center justify-between border-b pb-5"><div><p className="text-sm font-medium text-secondary">Student project workspace</p><h2 className="mt-1 text-2xl font-semibold">Marine observation log</h2></div><ShieldCheckIcon className="size-8 text-success"/></div><div className="flex flex-col gap-5 py-6"><div><div className="mb-2 flex justify-between text-sm"><span>Current milestone</span><span className="text-muted-foreground">Week 3</span></div><p className="font-medium">Identify patterns and document uncertainty</p></div>{["Field notes uploaded", "Measurement context recorded", "Weekly reflection due"].map((item, index) => <div key={item} className="flex items-center gap-3 border-t pt-4"><span className={`size-2 rounded-full ${index < 2 ? "bg-success" : "bg-accent"}`}/><span className="text-sm">{item}</span><span className="ml-auto text-xs text-muted-foreground">{index < 2 ? "Evidence linked" : "Planned"}</span></div>)}</div><Alert><ShieldCheckIcon/><AlertTitle>Private by default</AlertTitle><AlertDescription>Only the student and assigned counselor can access project records.</AlertDescription></Alert></div></div></section><section className="border-y bg-muted"><div className="mx-auto max-w-7xl px-5 py-18 lg:px-8"><div className="grid items-start gap-8 lg:grid-cols-[300px_1fr]"><div className="border-l-4 border-accent bg-card px-6 py-7 shadow-sm"><h2 className="text-3xl font-semibold leading-tight text-primary">From interest to evidence.</h2><p className="mt-4 text-base leading-7 text-muted-foreground">A focused process that keeps student ownership visible from the first plan to the final share link.</p></div><div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{steps.map(([Icon,title,body],i)=><div key={title} className="group flex min-h-56 flex-col border bg-card p-5 shadow-sm transition-colors hover:border-secondary/50"><div className="mb-7 flex items-start justify-between gap-4"><span className={`flex size-11 items-center justify-center rounded-md ${i===0?"bg-secondary text-secondary-foreground":i===1?"bg-success text-primary-foreground":i===2?"bg-accent text-accent-foreground":"bg-primary text-primary-foreground"}`}><Icon className="size-5"/></span><span className="font-heading text-sm font-semibold text-accent">0{i+1}</span></div><h3 className="text-lg font-semibold leading-6 text-primary">{title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{body}</p><div className="mt-auto pt-6"><div className="h-1.5 rounded-full bg-muted"><div className={`h-1.5 rounded-full ${i===0?"w-1/4 bg-secondary":i===1?"w-2/4 bg-success":i===2?"w-3/4 bg-accent":"w-full bg-primary"}`}/></div></div></div>)}</div></div></div></section><section className="bg-card"><div className="mx-auto grid max-w-7xl gap-6 px-5 py-18 md:grid-cols-2 lg:px-8"><Card><CardHeader><CardTitle>For students</CardTitle><CardDescription>Build credible work that reflects real interests and decisions.</CardDescription></CardHeader><CardContent><ul className="flex flex-col gap-3 text-sm"><li>Structured weekly plans and evidence</li><li>Reflection without automatic scoring</li><li>Editable portfolio and presentation outputs</li></ul><Button variant="link" className="mt-5 px-0" asChild><Link href={`/${locale}/students`}>Explore student features<ArrowRightIcon data-icon="inline-end"/></Link></Button></CardContent></Card><Card><CardHeader><CardTitle>For counselors</CardTitle><CardDescription>Review student-owned work through one evidence-first queue.</CardDescription></CardHeader><CardContent><ul className="flex flex-col gap-3 text-sm"><li>Proposal, evidence, and reflection review</li><li>Evidence-supported skill confirmation</li><li>Factual progress summaries</li></ul><Button variant="link" className="mt-5 px-0" asChild><Link href={`/${locale}/counselors`}>Explore counselor features<ArrowRightIcon data-icon="inline-end"/></Link></Button></CardContent></Card></div></section><section className="bg-primary text-primary-foreground"><div className="mx-auto flex max-w-7xl flex-col items-start gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between lg:px-8"><div><h2 className="text-3xl font-semibold">Build proof, not a persona.</h2><p className="mt-2 text-primary-foreground/70">Start with a free readiness assessment.</p></div><Button size="lg" variant="secondary" asChild><Link href={`/${locale}/register`}>Create an account<ArrowRightIcon data-icon="inline-end"/></Link></Button></div></section>
      <section className="border-y bg-muted/50">
        <div className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-primary">Trusted by students and counselors</h2>
            <p className="mt-4 text-lg text-muted-foreground">PortfolioPath helps build verifiable US college applications.</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm italic text-muted-foreground">&quot;The evidence tracker was exactly what I needed for my Common App activities section. I had dates, hours, and notes perfectly organized.&quot;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-semibold">SA</div>
                  <div>
                    <p className="text-sm font-semibold">Sarah A.</p>
                    <p className="text-xs text-muted-foreground">Class of 2025</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm italic text-muted-foreground">&quot;As a counselor, I appreciate the separation of student claims and counselor confirmations. It makes recommendations much more factual and impactful.&quot;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">MT</div>
                  <div>
                    <p className="text-sm font-semibold">Mark T.</p>
                    <p className="text-xs text-muted-foreground">Independent Counselor</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm italic text-muted-foreground">&quot;The AI prompts helped me focus on what I actually did rather than just trying to sound impressive. My supplemental essays wrote themselves.&quot;</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="size-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold">DK</div>
                  <div>
                    <p className="text-sm font-semibold">Deniz K.</p>
                    <p className="text-xs text-muted-foreground">Admitted Early Decision</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>


      <section className="bg-muted py-18">
        <div className="mx-auto max-w-7xl px-5 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold text-primary">Discover Authentic Projects</h2>
            <p className="mt-4 text-lg text-muted-foreground">
              See what structured planning and verified evidence look like in practice.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
                <Image
                  src="https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=800&auto=format&fit=crop"
                  alt="Students organizing archive materials"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-background/90 text-foreground backdrop-blur-sm shadow-sm hover:bg-background/90 border-0">History</Badge>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-primary">Community Oral History Archive</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">Documented neighborhood history through 12 elder interviews, preserving 40 hours of primary source audio.</p>
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="flex -space-x-2">
                    <div className="size-6 rounded-full border-2 border-background bg-secondary/30 flex items-center justify-center text-[10px] font-medium text-secondary">11</div>
                    <div className="size-6 rounded-full border-2 border-background bg-secondary/30 flex items-center justify-center text-[10px] font-medium text-secondary">12</div>
                  </div>
                  <span className="text-xs font-medium text-success flex items-center gap-1"><CheckCircle2Icon className="size-3"/> Verified</span>
                </div>
              </div>
            </div>

            <div className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md">
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
                <Image
                  src="https://images.unsplash.com/photo-1555949963-aa79dcee981c?q=80&w=800&auto=format&fit=crop"
                  alt="Student coding on laptop"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-background/90 text-foreground backdrop-blur-sm shadow-sm hover:bg-background/90 border-0">Computer Science</Badge>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-primary">Accessible Campus Map</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">Designed and coded an accessibility-focused map of the local community center with verified user feedback.</p>
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="flex -space-x-2">
                    <div className="size-6 rounded-full border-2 border-background bg-secondary/30 flex items-center justify-center text-[10px] font-medium text-secondary">10</div>
                  </div>
                  <span className="text-xs font-medium text-success flex items-center gap-1"><CheckCircle2Icon className="size-3"/> Verified</span>
                </div>
              </div>
            </div>

            <div className="group overflow-hidden rounded-xl border bg-card shadow-sm transition-all hover:shadow-md md:col-span-2 lg:col-span-1">
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted relative">
                <Image
                  src="https://images.unsplash.com/photo-1592424001806-031e345e6914?q=80&w=800&auto=format&fit=crop"
                  alt="Community garden harvest"
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3">
                  <Badge className="bg-background/90 text-foreground backdrop-blur-sm shadow-sm hover:bg-background/90 border-0">Environmental Science</Badge>
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-primary">Community Garden Yield Analysis</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">Implemented a data tracking system for a local community garden to optimize planting schedules based on 10 weeks of field data.</p>
                <div className="mt-4 flex items-center justify-between border-t pt-4">
                  <div className="flex -space-x-2">
                    <div className="size-6 rounded-full border-2 border-background bg-secondary/30 flex items-center justify-center text-[10px] font-medium text-secondary">12</div>
                  </div>
                  <span className="text-xs font-medium text-success flex items-center gap-1"><CheckCircle2Icon className="size-3"/> Verified</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card">
        <div className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-semibold text-primary">Designed for the Common App</h2>
              <p className="mt-4 text-lg text-muted-foreground">
                US universities want to see sustained commitment and verifiable impact. PortfolioPath structures your projects to match exactly what admissions officers look for.
              </p>
              <ul className="mt-6 flex flex-col gap-4">
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="mt-1 size-5 text-success" />
                  <span><strong>Activity List Ready:</strong> Export hours, roles, and descriptions formatted to fit the 150-character limit perfectly.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="mt-1 size-5 text-success" />
                  <span><strong>Supplemental Essay Source:</strong> Use your weekly reflections and evidence to write authentic, detail-rich essays.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle2Icon className="mt-1 size-5 text-success" />
                  <span><strong>Counselor Recommendations:</strong> Give your recommender factual evidence and confirmed skills, not vague claims.</span>
                </li>
              </ul>
            </div>
            <div className="relative rounded-xl border bg-muted/30 p-8 shadow-sm">
              <div className="absolute top-0 right-0 p-4 opacity-20"><ShieldCheckIcon className="size-24" /></div>
              <div className="space-y-4">
                <div className="rounded-lg border bg-background p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Common App Activity 1</p>
                  <p className="font-semibold text-sm">Founder, Community Oral History Archive</p>
                  <p className="text-xs text-muted-foreground mt-2">Interviewed 12 local elders. Transcribed 40 hours of audio. Built digital archive preserving neighborhood history. Confirmed by school counselor.</p>
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">11th, 12th Grade</span>
                    <span className="flex items-center gap-1">4 hrs/wk</span>
                    <span className="flex items-center gap-1">20 weeks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card border-y border-muted">
        <div className="mx-auto max-w-7xl px-5 py-18 lg:px-8">
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
