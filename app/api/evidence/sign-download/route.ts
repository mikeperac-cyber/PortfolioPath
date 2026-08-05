import { NextResponse } from "next/server"
import { z } from "zod"
import { getApiContext, invalid } from "@/lib/api-auth"
import { enforceRateLimit } from "@/lib/rate-limit"
const schema=z.object({evidenceId:z.string().uuid()})
export async function POST(request:Request){try{const input=schema.parse(await request.json());const context=await getApiContext(["student","counselor"]);if(context.error)return context.error;const rate=enforceRateLimit(request,`signed-download:${context.user.id}`,60,10*60*1000);if(!rate.allowed)return NextResponse.json({error:"Too many download requests. Try again shortly."},{status:429,headers:{"Retry-After":String(rate.retryAfterSeconds)}});const {supabase}=context;const {data:item}=await supabase.from("evidence").select("storage_path").eq("id",input.evidenceId).single();if(!item?.storage_path)return NextResponse.json({error:"Private file not found."},{status:404});const {data,error}=await supabase.storage.from("evidence").createSignedUrl(item.storage_path,60,{download:true});if(error)throw error;return NextResponse.json({url:data.signedUrl,expiresIn:60})}catch(error){return invalid(error)}}
