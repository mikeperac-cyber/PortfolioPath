import { notFound } from "next/navigation"
import { StudentWorkspace } from "@/components/student-workspace"
import { requireRole } from "@/lib/auth"
const sections=["dashboard","onboarding","project-ideas","projects","planner","evidence","reflections","skills","feedback","portfolio","presentation","application-prep","recommendation-evidence","subscription"]
export default async function StudentSectionPage({params}:{params:Promise<{locale:string;section:string}>}){const {locale,section}=await params;if(!sections.includes(section))notFound();const user=await requireRole("student",locale);return <StudentWorkspace section={section} studentName={user.full_name}/>}
