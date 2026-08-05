import { notFound } from "next/navigation"
import { AdminWorkspace } from "@/components/admin-workspace"
const sections=["dashboard","users","assignments","categories","templates","plans","flags","settings"]
export default async function AdminPage({params}:{params:Promise<{section:string}>}){const {section}=await params;if(!sections.includes(section))notFound();return <AdminWorkspace section={section}/>}
