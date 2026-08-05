"use client"
/* eslint-disable react-hooks/set-state-in-effect -- onboarding hydration and autosave status intentionally synchronize with browser storage */

import Link from "next/link"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowRightIcon, CheckCircle2Icon, Clock3Icon, EyeIcon, FileArchiveIcon, LightbulbIcon, LoaderCircleIcon, LockKeyholeIcon, MessageSquareTextIcon, NotebookPenIcon, PlusIcon, SaveIcon, ShieldCheckIcon, SparklesIcon, TargetIcon, UploadCloudIcon } from "lucide-react"
import { toast } from "sonner"
import { SectionHeader } from "@/components/section-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"

type Idea = { title:string; category:string; description:string; fit:string; majorConnection:string; durationWeeks:number; weeklyHours:number; estimatedCostTry:number; finalDeliverable:string; expectedEvidence:string[]; targetSkills:string[]; measurableOutcomes:string[]; risks:string[]; ethicalNotes:string[] }
const starterSkills = [["Research","target skill","Selected during onboarding"],["Writing","target skill","Useful for portfolio pages"],["Project management","target skill","Useful for weekly milestones"]] as const

function EmptyActionCard({ icon:Icon, title, description, action }: { icon:typeof LightbulbIcon; title:string; description:string; action:React.ReactNode }) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <Icon className="size-9 text-accent" aria-hidden="true"/>
        <h2 className="mt-4 text-xl font-semibold text-primary">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        <div className="mt-6">{action}</div>
      </CardContent>
    </Card>
  )
}

function readStoredDraft(key:string) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as Record<string,string> : null
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

function StatusBadge({ children }: { children: React.ReactNode }) { const text=String(children).toLowerCase(); const variant=text.includes("confirmed")||text.includes("accepted")||text.includes("complete")?"default":text.includes("review")||text.includes("progress")?"secondary":"outline"; return <Badge variant={variant}>{children}</Badge> }
function Stat({ icon:Icon, label, value, note }: { icon:typeof Clock3Icon; label:string; value:string; note:string }) { return <Card><CardContent className="flex items-start justify-between pt-6"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold text-primary">{value}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></div><Icon className="size-5 text-secondary"/></CardContent></Card> }

const weeklyPath = [
  { label: "Do the work", detail: "Complete this week's observation task", href: "planner", done: false },
  { label: "Show the work", detail: "Attach a dated photo, note, file, or link", href: "evidence", done: false },
  { label: "Explain the learning", detail: "Write one concrete weekly reflection", href: "reflections", done: false },
  { label: "Ask for review", detail: "Submit the week to your counselor", href: "feedback", done: false },
] as const

function Dashboard({locale,studentName}:{locale:string;studentName:string}) {
  const firstName = studentName.trim().split(/\s+/)[0] || "Student"
  return <>
    <SectionHeader
      eyebrow="Student overview"
      title={`Welcome back, ${firstName}.`}
      description="Start with a real interest, choose a feasible project, then document only what you genuinely do."
      action={<Button asChild><Link href={`/${locale}/student/project-ideas`}>Generate project ideas<ArrowRightIcon data-icon="inline-end"/></Link></Button>}
    />
    <Alert className="mb-6 border-accent/60 bg-accent/10">
      <TargetIcon/>
      <AlertTitle>Next best action: complete your profile and choose a project direction</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span>No completed work is shown until you create a real project and add your own tasks, evidence, and reflections.</span>
        <Button size="sm" variant="outline" asChild><Link href={`/${locale}/student/onboarding`}>Open profile<ArrowRightIcon data-icon="inline-end"/></Link></Button>
      </AlertDescription>
    </Alert>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Stat icon={Clock3Icon} label="Tasks due" value="0" note="Create a project first"/>
      <Stat icon={FileArchiveIcon} label="Evidence items" value="0" note="Upload only your own work"/>
      <Stat icon={NotebookPenIcon} label="Reflections" value="0" note="Write after real progress"/>
      <Stat icon={TargetIcon} label="Confirmed skills" value="0" note="Counselor review required"/>
    </div>
    <div className="mt-6 grid gap-6 xl:grid-cols-[1.45fr_.95fr]">
      <EmptyActionCard
        icon={LightbulbIcon}
        title="No active project yet"
        description="PortfolioPath will stay blank until you choose a genuine project direction. This prevents sample work from being mistaken for your achievements."
        action={<div className="flex flex-wrap justify-center gap-3"><Button asChild><Link href={`/${locale}/student/project-ideas`}>Find project ideas</Link></Button><Button variant="outline" asChild><Link href={`/${locale}/student/projects/new`}>Create manually</Link></Button></div>}
      />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader><CardTitle>Your weekly path</CardTitle><CardDescription>Four small steps turn genuine activity into credible documentation.</CardDescription></CardHeader>
          <CardContent className="flex flex-col gap-2">{weeklyPath.map((item,index)=><Link key={item.label} href={`/${locale}/student/${item.href}`} className="group flex items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">{index+1}</span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{item.label}</span><span className="block text-xs leading-5 text-muted-foreground">{item.detail}</span></span><ArrowRightIcon className="mt-1 size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"/></Link>)}</CardContent>
        </Card>
        <Alert><MessageSquareTextIcon/><AlertTitle>No counselor feedback yet</AlertTitle><AlertDescription>Feedback appears only after you submit a real proposal, task, reflection, or evidence item for review.</AlertDescription></Alert>
      </div>
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Portfolio readiness</CardTitle><CardDescription>Complete these before private sharing.</CardDescription></CardHeader><CardContent className="flex flex-col gap-4">{["Project objective supported by your plan","Evidence selected from your uploads","Final reflection completed","Factual accuracy confirmed"].map(label=><div key={label} className="flex items-center gap-3 text-sm"><span className="size-4 rounded-full border" aria-hidden="true"/><span>{label}</span></div>)}<Progress value={0} aria-label="Portfolio readiness: 0 percent"/></CardContent></Card>
      <Card><CardHeader><CardTitle>Skills being developed</CardTitle><CardDescription>Evidence and counselor review—not numerical AI scores.</CardDescription></CardHeader><CardContent className="grid gap-3">{starterSkills.map(row=><div key={row[0]} className="flex items-center justify-between gap-3 border p-3"><div><p className="font-medium">{row[0]}</p><p className="mt-1 text-xs text-muted-foreground">{row[2]}</p></div><StatusBadge>{row[1]}</StatusBadge></div>)}</CardContent></Card>
    </div>
  </>
}

const onboardingGroups = [
  ["Basics",[["fullName","Full name","text"],["age","Age","number"],["schoolYear","School year","text"],["city","City","text"],["country","Country","text"],["targetApplicationYear","Target application year","number"]]],
  ["Direction",[["destination","Intended university destination","text"],["intendedMajor","Intended major","text"],["careerInterests","Career interests","textarea"],["personalInterests","Personal interests","textarea"],["currentActivities","Current activities","textarea"],["causes","Causes or problems you care about","textarea"]]],
  ["Resources",[["existingSkills","Existing skills","textarea"],["targetSkills","Skills to develop","textarea"],["weeklyHours","Available hours per week","number"],["budgetTry","Approximate budget (TRY)","number"],["technologyAccess","Available technology","textarea"],["preferredCategories","Preferred project categories","textarea"],["previousExperiences","Previous relevant experiences","textarea"]]],
] as const
function Onboarding({studentName}:{studentName:string}) {
  const [step,setStep]=useState(0)
  const [saved,setSaved]=useState(true)
  const [busy,setBusy]=useState(false)
  const [values,setValues]=useState<Record<string,string>>({fullName:studentName,country:"Türkiye"})
  useEffect(()=>{const draft=readStoredDraft("pp-onboarding");if(draft)setValues(current=>({...current,...draft}))},[])
  useEffect(()=>{setSaved(false);const id=setTimeout(()=>{localStorage.setItem("pp-onboarding",JSON.stringify(values));setSaved(true)},500);return()=>clearTimeout(id)},[values])
  const [title,fields]=onboardingGroups[step]
  const list=(key:string)=>values[key]?.split(",").map(value=>value.trim()).filter(Boolean)??[]
  const requiredComplete = fields.every(([key])=>values[key]?.trim())

  async function complete(){
    setBusy(true)
    try{
      const supabase=createClient()
      const {data:{user}}=await supabase.auth.getUser()
      if(!user)throw new Error("Your session has expired.")
      const preferredNames=list("preferredCategories")
      const {data:categories,error:categoryError}=preferredNames.length
        ? await supabase.from("project_categories").select("id,name_en").in("name_en",preferredNames)
        : {data:[],error:null}
      if(categoryError)throw categoryError
      const {error:profileError}=await supabase.from("student_profiles").update({
        age:values.age?Number(values.age):null,school_year:values.schoolYear||null,city:values.city||null,country:values.country||"Türkiye",target_application_year:values.targetApplicationYear?Number(values.targetApplicationYear):null,intended_destinations:list("destination"),intended_major:values.intendedMajor||null,career_interests:list("careerInterests"),personal_interests:list("personalInterests"),current_activities:list("currentActivities"),existing_skills:list("existingSkills"),target_skills:list("targetSkills"),causes:list("causes"),weekly_hours:values.weeklyHours?Number(values.weeklyHours):null,budget_try:values.budgetTry?Number(values.budgetTry):null,technology_access:list("technologyAccess"),preferred_categories:categories?.map(category=>category.id)??[],previous_experiences:values.previousExperiences||null,onboarding_step:onboardingGroups.length,onboarding_completed:true,updated_at:new Date().toISOString()
      }).eq("user_id",user.id)
      if(profileError)throw profileError
      const {error:userError}=await supabase.from("users").update({full_name:values.fullName.trim(),updated_at:new Date().toISOString()}).eq("id",user.id)
      if(userError)throw userError
      localStorage.removeItem("pp-onboarding")
      toast.success("Profile saved. Your project suggestions can now use these details.")
    }catch(error){toast.error(error instanceof Error?error.message:"Could not save profile")}
    finally{setBusy(false)}
  }

  return <>
    <SectionHeader eyebrow={`Step ${step+1} of ${onboardingGroups.length}`} title="Student onboarding" description="Your answers guide realistic project suggestions. You can return and update them at any time." action={<span className="flex items-center gap-2 text-xs text-muted-foreground" role="status">{saved?<CheckCircle2Icon className="size-4 text-success"/>:<LoaderCircleIcon className="size-4 animate-spin"/>}{saved?"Draft autosaved on this device":"Saving draft…"}</span>}/>
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <Progress value={((step+1)/onboardingGroups.length)*100} aria-label={`Onboarding step ${step+1} of ${onboardingGroups.length}`}/>
      <Card>
        <CardHeader><CardTitle>{title}</CardTitle><CardDescription>Use factual, specific information. For list fields, separate items with commas. Write “none yet” if that is the accurate answer.</CardDescription></CardHeader>
        <CardContent><FieldGroup>{fields.map(([key,label,type])=><Field key={key}><FieldLabel htmlFor={key}>{label}</FieldLabel>{type==="textarea"?<Textarea id={key} value={values[key]??""} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/>:<Input id={key} type={type} min={type==="number"?0:undefined} value={values[key]??""} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/>}<FieldDescription>{key==="preferredCategories"?"Use category names such as Research, Sports, or Coding and technology.":key==="previousExperiences"?"Small, informal, and unfinished experiences are still useful context.":undefined}</FieldDescription></Field>)}</FieldGroup></CardContent>
        <CardFooter className="flex-wrap justify-between gap-3 border-t"><Button variant="outline" disabled={step===0||busy} onClick={()=>setStep(step-1)}>Back</Button><div className="flex items-center gap-3"><span className="text-xs text-muted-foreground">Complete every field to continue</span><Button disabled={busy||!requiredComplete} onClick={()=>step<onboardingGroups.length-1?setStep(step+1):complete()}>{busy?<LoaderCircleIcon data-icon="inline-start" className="animate-spin"/>:null}{step<onboardingGroups.length-1?"Continue":"Complete onboarding"}<ArrowRightIcon data-icon="inline-end"/></Button></div></CardFooter>
      </Card>
    </div>
  </>
}

function ProjectIdeas({locale}:{locale:string}) {
  const [ideas,setIdeas]=useState<Idea[]>([])
  const [busy,setBusy]=useState(false)
  const [loadingProfile,setLoadingProfile]=useState(true)
  const [major,setMajor]=useState("")
  const [interests,setInterests]=useState("")
  const [weeklyHours,setWeeklyHours]=useState(4)
  const [budgetTry,setBudgetTry]=useState(1500)

  useEffect(()=>{
    let active=true
    async function loadProfile(){
      try{
        const supabase=createClient()
        const {data:{user}}=await supabase.auth.getUser()
        if(!user)return
        const {data}=await supabase.from("student_profiles").select("intended_major,personal_interests,current_activities,weekly_hours,budget_try").eq("user_id",user.id).maybeSingle()
        if(!active||!data)return
        setMajor(data.intended_major??"")
        setInterests([...(data.personal_interests??[]),...(data.current_activities??[])].join(", "))
        setWeeklyHours(Number(data.weekly_hours)||4)
        setBudgetTry(data.budget_try??1500)
      }finally{if(active)setLoadingProfile(false)}
    }
    void loadProfile()
    return()=>{active=false}
  },[])

  async function generate(){
    const interestList=interests.split(",").map(value=>value.trim()).filter(Boolean)
    if(!interestList.length)return toast.error("Add at least one genuine interest or current activity.")
    if(!major.trim())return toast.error("Add an intended major, or write ‘undecided’.")
    setBusy(true)
    try{
      const response=await fetch("/api/generate/project-ideas",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({interests:interestList,intendedMajor:major.trim(),weeklyHours,budgetTry,categories:[],locale})})
      const body=await response.json()
      if(!response.ok)throw new Error(body.error??"Could not generate ideas")
      setIdeas(body.data)
      toast.success("Three realistic project directions are ready.")
    }catch(error){toast.error(error instanceof Error?error.message:"Could not generate ideas. Please try again.")}
    finally{setBusy(false)}
  }

  return <>
    <SectionHeader eyebrow="Guided suggestions" title="Project idea generator" description="Your saved profile is used as a starting point. Adjust anything that has changed, then compare three realistic directions."/>
    <Alert className="mb-6"><SparklesIcon/><AlertTitle>Suggestions, not achievements</AlertTitle><AlertDescription>These ideas describe possible future work. Selecting one does not claim it has been started or completed.</AlertDescription></Alert>
    <Card>
      <CardHeader><CardTitle>Match ideas to your real life</CardTitle><CardDescription>Good projects fit the time, resources, interests, and experience you actually have.</CardDescription></CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Field className="xl:col-span-2"><FieldLabel htmlFor="interests">Interests and current activities</FieldLabel><Input id="interests" value={interests} onChange={e=>setInterests(e.target.value)} disabled={loadingProfile}/><FieldDescription>Comma-separated; loaded from your profile when available</FieldDescription></Field>
        <Field><FieldLabel htmlFor="major">Intended major</FieldLabel><Input id="major" value={major} onChange={e=>setMajor(e.target.value)} disabled={loadingProfile}/></Field>
        <Field><FieldLabel htmlFor="weekly-hours">Hours available each week</FieldLabel><Input id="weekly-hours" type="number" min={1} max={30} value={weeklyHours} onChange={e=>setWeeklyHours(Number(e.target.value))}/></Field>
        <Field><FieldLabel htmlFor="budget">Maximum budget (TRY)</FieldLabel><Input id="budget" type="number" min={0} max={100000} value={budgetTry} onChange={e=>setBudgetTry(Number(e.target.value))}/><FieldDescription>A lower budget will produce lower-cost directions.</FieldDescription></Field>
      </CardContent>
      <CardFooter className="justify-end border-t"><Button onClick={generate} disabled={busy||loadingProfile}>{busy||loadingProfile?<LoaderCircleIcon data-icon="inline-start" className="animate-spin"/>:<SparklesIcon data-icon="inline-start"/>}{loadingProfile?"Loading your profile…":busy?"Building matches…":"Generate three matches"}</Button></CardFooter>
    </Card>
    {ideas.length>0&&<div className="mt-6 grid gap-5 xl:grid-cols-3">{ideas.map((idea,index)=><Card key={idea.title} className="flex flex-col"><CardHeader><div className="flex items-center justify-between gap-3"><Badge variant="secondary">Option {index+1}</Badge><Badge variant="outline">{idea.category}</Badge></div><CardTitle className="mt-3">{idea.title}</CardTitle><CardDescription>{idea.description}</CardDescription></CardHeader><CardContent className="flex flex-1 flex-col gap-5 text-sm"><div><p className="font-medium">Why it fits you</p><p className="mt-1 text-muted-foreground">{idea.fit}</p></div><div><p className="font-medium">Connection to your intended major</p><p className="mt-1 text-muted-foreground">{idea.majorConnection}</p></div><div className="grid grid-cols-3 gap-2 border-y py-4 text-center"><span><b className="block">{idea.durationWeeks}</b>weeks</span><span><b className="block">{idea.weeklyHours}</b>hrs/week</span><span><b className="block">₺{idea.estimatedCostTry}</b>estimate</span></div><div><p className="font-medium">Tangible final output</p><p className="mt-1 text-muted-foreground">{idea.finalDeliverable}</p></div><div><p className="font-medium">Evidence you can collect</p><p className="mt-1 text-muted-foreground">{idea.expectedEvidence.join(" · ")}</p></div><div><p className="font-medium">Target skills</p><p className="mt-1 text-muted-foreground">{idea.targetSkills.join(" · ")}</p></div><div><p className="font-medium">Measurable outcome ideas</p><ul className="mt-1 list-disc pl-5 text-muted-foreground">{idea.measurableOutcomes.map(value=><li key={value}>{value}</li>)}</ul></div><div><p className="font-medium">Possible challenges</p><p className="mt-1 text-muted-foreground">{idea.risks.join(" · ")}</p></div><Alert><ShieldCheckIcon/><AlertTitle>Ethical check</AlertTitle><AlertDescription>{idea.ethicalNotes.join(" ")}</AlertDescription></Alert></CardContent><CardFooter><Button className="w-full" asChild><Link href={`/${locale}/student/projects/new?idea=${encodeURIComponent(idea.title)}`}>Build this project<ArrowRightIcon data-icon="inline-end"/></Link></Button></CardFooter></Card>)}</div>}
  </>
}

function Projects({locale}:{locale:string}) { return <><SectionHeader eyebrow="Projects" title="My projects" description="Only work supported by tasks and evidence can move from planned to completed." action={<Button asChild><Link href={`/${locale}/student/projects/new`}><PlusIcon data-icon="inline-start"/>New project</Link></Button>}/><EmptyActionCard icon={LightbulbIcon} title="No student projects yet" description="Create your first project from a generated idea or start manually. The workspace will show tasks, evidence, and progress only after you create real records." action={<div className="flex flex-wrap justify-center gap-3"><Button asChild><Link href={`/${locale}/student/project-ideas`}>Explore ideas</Link></Button><Button variant="outline" asChild><Link href={`/${locale}/student/projects/new`}>Create project</Link></Button></div>}/></> }

function Planner(){const params=useParams<{locale:string}>();const locale=params.locale??"en";return <><SectionHeader eyebrow="Weekly planner" title="Plan your first real week" description="Weekly tasks appear after you create a project blueprint. Task completion remains separate from counselor review."/><EmptyActionCard icon={Clock3Icon} title="No weekly tasks yet" description="Create a project first, then PortfolioPath will turn its milestones into weekly tasks you can actually complete and document." action={<Button asChild><Link href={`/${locale}/student/project-ideas`}>Choose a project idea</Link></Button>}/><Card className="mt-6"><CardHeader><CardTitle>Reflection prompt preview</CardTitle><CardDescription>Use this after real work happens.</CardDescription></CardHeader><CardContent><Textarea rows={5} placeholder="What did you do? What changed? What evidence supports this? What will you do next?"/></CardContent><CardFooter><Button disabled><SaveIcon data-icon="inline-start"/>Save after project creation</Button></CardFooter></Card></>}

function Evidence({studentName}:{studentName:string}){
  const [title,setTitle]=useState("")
  const [explanation,setExplanation]=useState("")
  const [file,setFile]=useState<File|null>(null)
  const [busy,setBusy]=useState(false)

  async function upload(){
    void studentName
    if(!title.trim())return toast.error("Give this evidence a short, specific title.")
    if(!explanation.trim())return toast.error("Explain what this evidence shows about your work.")
    if(!file)return toast.error("Choose a supported file.")
    setBusy(true)
    toast.error("Create a real project before uploading evidence.")
    setBusy(false)
  }

  return <>
    <SectionHeader eyebrow="Private storage" title="Evidence vault" description="Save proof as you work—not weeks later. Original files stay private unless you explicitly select them for a share page."/>
    <Alert className="mb-6"><LockKeyholeIcon/><AlertTitle>What counts as useful evidence?</AlertTitle><AlertDescription>A dated photo, field note, document version, spreadsheet, repository history, or link that helps someone understand what you personally did. Add context; a file alone rarely tells the whole story.</AlertDescription></Alert>
    <Card>
      <CardHeader><CardTitle>Add one evidence item</CardTitle><CardDescription>Files are checked for ownership, type, extension, plan access, and size before upload.</CardDescription></CardHeader>
      <CardContent className="grid gap-5 lg:grid-cols-2">
        <Field><FieldLabel htmlFor="evidence-file">1. Choose a file</FieldLabel><Input id="evidence-file" type="file" accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf,.docx,.xlsx,.csv" onChange={event=>setFile(event.target.files?.[0]??null)}/><FieldDescription>PNG, JPG, WebP, MP4, PDF, DOCX, XLSX, or CSV; maximum 25 MB.</FieldDescription></Field>
        <Field><FieldLabel htmlFor="evidence-title">2. Give it a clear title</FieldLabel><Input id="evidence-title" value={title} onChange={e=>setTitle(e.target.value)} placeholder="Example: Week 3 observation notes"/></Field>
        <Field className="lg:col-span-2"><FieldLabel htmlFor="evidence-explanation">3. Explain what it shows</FieldLabel><Textarea id="evidence-explanation" rows={4} value={explanation} onChange={e=>setExplanation(e.target.value)} placeholder="What did you create, observe, decide, or change? How does this file support that statement?"/><FieldDescription>Use your own words. Do not claim impact, participants, or results the file cannot support.</FieldDescription></Field>
      </CardContent>
      <CardFooter className="justify-between gap-3 border-t"><p className="text-xs text-muted-foreground">Uploads unlock after you create a real project, so no evidence is attached to sample work.</p><Button disabled={busy||!file||!title.trim()||!explanation.trim()} onClick={upload}>{busy?<LoaderCircleIcon data-icon="inline-start" className="animate-spin"/>:<UploadCloudIcon data-icon="inline-start"/>}{busy?"Checking…":"Upload as private evidence"}</Button></CardFooter>
    </Card>
    <Card className="mt-6"><CardHeader><CardTitle>Project evidence</CardTitle><CardDescription>Uploader, date, and review state remain visible as provenance.</CardDescription></CardHeader><CardContent><div className="rounded-lg border border-dashed p-8 text-center"><FileArchiveIcon className="mx-auto size-8 text-accent"/><h3 className="mt-4 font-semibold">No evidence uploaded yet</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Once you create a project, your own files and links will appear here with review status and privacy controls.</p></div></CardContent></Card>
  </>
}

function Reflections(){return <><SectionHeader eyebrow="Student-authored" title="Reflection journal" description="Concrete examples matter more than polished language. Counselors can comment, but reflections receive no automatic score."/><Tabs defaultValue="weekly"><TabsList><TabsTrigger value="weekly">Weekly</TabsTrigger><TabsTrigger value="midpoint">Midpoint</TabsTrigger><TabsTrigger value="final">Final</TabsTrigger></TabsList>{["weekly","midpoint","final"].map(type=><TabsContent key={type} value={type}><Card><CardHeader><CardTitle className="capitalize">{type} reflection</CardTitle><CardDescription>What did you complete? What was difficult? What decision did you make? What evidence shows progress? What will you do next?</CardDescription></CardHeader><CardContent><Textarea rows={10} placeholder="Use concrete examples from your own work…"/></CardContent><CardFooter className="justify-between"><span className="text-xs text-muted-foreground">Clearly labeled as a student-authored statement</span><Button disabled><SaveIcon data-icon="inline-start"/>Save after project creation</Button></CardFooter></Card></TabsContent>)}</Tabs></>}

function Skills(){return <><SectionHeader eyebrow="Evidence-linked" title="Skills tracker" description="PortfolioPath uses only three states: target, evidence-supported, and counselor-confirmed."/><Card><CardContent className="pt-6"><Table><TableHeader><TableRow><TableHead>Skill</TableHead><TableHead>Status</TableHead><TableHead>Connected evidence</TableHead><TableHead>Review</TableHead></TableRow></TableHeader><TableBody>{starterSkills.map(row=><TableRow key={row[0]}><TableCell className="font-medium">{row[0]}</TableCell><TableCell><StatusBadge>{row[1]}</StatusBadge></TableCell><TableCell>{row[2]}</TableCell><TableCell><Button size="sm" variant="ghost" disabled><EyeIcon/>No evidence yet</Button></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></>}

function Feedback(){return <><SectionHeader eyebrow="Counselor review" title="Counselor feedback" description="Feedback cannot modify your source work. You decide how to revise your content."/><EmptyActionCard icon={MessageSquareTextIcon} title="No counselor feedback yet" description="Comments and review decisions appear here only after you submit your own proposal, weekly task, reflection, or evidence item." action={<Button variant="outline" disabled>Awaiting real submission</Button>}/></>}

const portfolioSections=["Project summary","Personal motivation","Objective","Problem or opportunity","Actions","Timeline","Evidence","Outcomes","Challenges","Adaptations","Skills","Reflection","Intended-major connection","Future development"]
function Portfolio(){const params=useParams<{locale:string}>();const locale=params.locale??"en";const [selected,setSelected]=useState(portfolioSections);return <><SectionHeader eyebrow="Private preview" title="Portfolio builder" description="Arrange, edit, and hide sections. Planned and completed information remains visibly distinct." action={<Button variant="outline" disabled><EyeIcon data-icon="inline-start"/>Preview after project creation</Button>}/><div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]"><Card><CardHeader><CardTitle>Future sections</CardTitle><CardDescription>These sections become editable after a real project exists.</CardDescription></CardHeader><CardContent className="space-y-2">{portfolioSections.map(section=><label key={section} className="flex items-center gap-3 border p-3 text-sm"><Checkbox checked={selected.includes(section)} onCheckedChange={checked=>setSelected(checked?[...selected,section]:selected.filter(v=>v!==section))}/>{section}</label>)}</CardContent></Card><EmptyActionCard icon={FileArchiveIcon} title="No portfolio page yet" description="A portfolio page should be generated only from your approved project description, completed tasks, accepted evidence, reflections, outcomes, and counselor-confirmed skills." action={<Button asChild><Link href={`/${locale}/student/project-ideas`}>Start with project ideas</Link></Button>}/></div><Card className="mt-6"><CardHeader><CardTitle>Export and private sharing</CardTitle><CardDescription>These remain locked until there is a fact-checked portfolio page.</CardDescription></CardHeader><CardContent><label className="flex items-start gap-3 text-sm text-muted-foreground"><Checkbox disabled/><span>Factual accuracy confirmation appears before publishing, exporting, or creating a share link.</span></label></CardContent><CardFooter className="flex-wrap gap-3"><Button disabled>Export PDF</Button><Button disabled variant="outline">Create 30-day link</Button></CardFooter></Card></>}

function GeneratedWorkspace({type}:{type:"presentation"|"recommendation"}){return <><SectionHeader eyebrow="Editable guidance" title={type==="presentation"?"Presentation builder":"Recommendation evidence summary"} description={type==="presentation"?"Generate editable 30-second, 90-second, and three-minute versions plus interview preparation.":"Assemble only completed tasks, reviewed evidence, counselor-confirmed skills, reflections, and documented outcomes."} action={<Button disabled><SparklesIcon data-icon="inline-start"/>Generate after project creation</Button>}/>{type==="recommendation"&&<Alert className="mb-6"><ShieldCheckIcon/><AlertTitle>Required warning</AlertTitle><AlertDescription>This document provides evidence for a recommender. It is not a recommendation letter and must not contain invented observations.</AlertDescription></Alert>}<EmptyActionCard icon={SparklesIcon} title="No source records yet" description="Draft generation unlocks only after PortfolioPath has real source records from your project. It will not use sample achievements, invented observations, or fake counselor comments." action={<Button variant="outline" disabled>Waiting for verified project data</Button>}/></>}

function Subscription(){const params=useParams<{locale:string}>();const [busy,setBusy]=useState<string|null>(null);async function checkout(planCode:"blueprint"|"complete"){setBusy(planCode);try{const response=await fetch("/api/billing/checkout",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({planCode,locale:params.locale??"en"})});const body=await response.json();if(!response.ok)throw new Error(body.error??"Could not start checkout");if(body.url)window.location.assign(body.url);else toast.success("Test checkout created")}catch(error){toast.error(error instanceof Error?error.message:"Checkout failed")}finally{setBusy(null)}}const plans=[{name:"Free Assessment",price:"₺0",description:"Onboarding and one limited direction",code:null},{name:"Project Blueprint",price:"₺1,200",description:"Three ideas and one blueprint project",code:"blueprint" as const},{name:"Complete Student Portfolio",price:"₺5,500",description:"Up to three projects and all portfolio tools",code:"complete" as const}];return <><SectionHeader eyebrow="Billing" title="Subscription settings" description="Payments use a provider abstraction. Local development uses a safe test adapter; production can use Stripe-compatible checkout."/><div className="grid gap-5 lg:grid-cols-3">{plans.map((plan,i)=><Card key={plan.name} className={i===2?"border-accent":""}><CardHeader><CardTitle>{plan.name}</CardTitle><CardDescription>{plan.description}</CardDescription></CardHeader><CardContent><p className="text-3xl font-semibold text-primary">{plan.price}</p><p className="mt-1 text-xs text-muted-foreground">{i===0?"Free":"One-time payment"}</p></CardContent><CardFooter><Button disabled={!plan.code||busy!==null} variant={i===2?"default":"outline"} className="w-full" onClick={()=>plan.code&&checkout(plan.code)}>{plan.code&&busy===plan.code?<LoaderCircleIcon data-icon="inline-start" className="animate-spin"/>:null}{i===0?"Included":i===2?"Current plan":"Choose plan"}</Button></CardFooter></Card>)}</div></>}

export function StudentWorkspace({section,studentName}:{section:string;studentName:string}){const params=useParams<{locale:string}>();const locale=params.locale??"en";return section==="dashboard"?<Dashboard locale={locale} studentName={studentName}/>:section==="onboarding"?<Onboarding studentName={studentName}/>:section==="project-ideas"?<ProjectIdeas locale={locale}/>:section==="projects"?<Projects locale={locale}/>:section==="planner"?<Planner/>:section==="evidence"?<Evidence studentName={studentName}/>:section==="reflections"?<Reflections/>:section==="skills"?<Skills/>:section==="feedback"?<Feedback/>:section==="portfolio"?<Portfolio/>:section==="presentation"?<GeneratedWorkspace type="presentation"/>:section==="recommendation-evidence"?<GeneratedWorkspace type="recommendation"/>:<Subscription/>}
