import { notFound } from "next/navigation"
import { CounselorWorkspace } from "@/components/counselor-workspace"
const sections=["dashboard","students","proposals","weekly-progress","evidence","reflections","skills","progress-reports","subscription"]
export default async function CounselorPage({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!sections.includes(section))notFound();return <CounselorWorkspace section={section}/>}
