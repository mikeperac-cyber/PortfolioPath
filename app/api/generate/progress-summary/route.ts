import { z } from "zod"
import { invalid } from "@/lib/api-auth"
import { generateResponse } from "@/lib/generation/route"
const schema=z.object({projectId:z.string().uuid(),locale:z.enum(["en","tr"]).default("en"),sourceRecordIds:z.array(z.string().uuid()).max(200).default([])}).passthrough()
export async function POST(request:Request){try{const input=schema.parse(await request.json());return generateResponse("progress_summary",input,input.sourceRecordIds)}catch(error){return invalid(error)}}
