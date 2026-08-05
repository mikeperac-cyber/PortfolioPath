import { Suspense } from "react"
import { ProjectWizard } from "@/components/project-wizard"
export default function NewProjectPage(){return <Suspense fallback={<div className="h-96 animate-pulse bg-muted"/>}><ProjectWizard/></Suspense>}
