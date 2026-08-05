import { NextResponse } from "next/server"
import type { GenerationType } from "@/lib/domain"
import { getApiContext } from "@/lib/api-auth"
import { getGenerationProvider } from "@/lib/generation"
import { hashInput } from "@/lib/security"
import { createAdminClient } from "@/lib/supabase/admin"

export async function generateResponse(type: GenerationType, input: Record<string,unknown>, sourceRecordIds: string[] = []) {
  const context = await getApiContext(type === "progress_summary" ? ["counselor"] : ["student","counselor"])
  if (context.error) return context.error
  const { supabase, user } = context
  const since = new Date(Date.now()-60*60*1000).toISOString()
  const { count } = await supabase.from("generation_requests").select("id",{count:"exact",head:true}).eq("user_id",user.id).gte("created_at",since)
  if ((count??0)>=20) return NextResponse.json({error:"Generation limit reached. Try again later."},{status:429,headers:{"Retry-After":"3600"}})
  const locale: "en" | "tr" = input.locale === "tr" ? "tr" : "en"
  const provider=getGenerationProvider(); const generationContext={userId:user.id,projectId:typeof input.projectId==="string"?input.projectId:undefined,locale,sourceRecordIds}
  const result=type==="project_ideas"?await provider.projectIdeas(input,generationContext):type==="presentation"?await provider.presentation(input,generationContext):type==="recommendation_evidence"?await provider.recommendationEvidence(input,generationContext):await provider.progressSummary(input,generationContext)
  const { error: logError } = await createAdminClient().from("generation_requests").insert({user_id:user.id,project_id:generationContext.projectId??null,generation_type:type,provider:"template",source_record_ids:sourceRecordIds,input_hash:hashInput(input),output:result.data,warnings:result.provenance.warnings})
  if (logError) return NextResponse.json({error:"The guidance was not returned because its provenance record could not be stored."},{status:500})
  return NextResponse.json(result)
}
