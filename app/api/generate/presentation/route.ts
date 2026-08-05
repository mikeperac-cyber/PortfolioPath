import { z } from "zod"
import { invalid } from "@/lib/api-auth"
import { generateResponse } from "@/lib/generation/route"
const schema=z.object({projectId:z.string().uuid(),locale:z.enum(["en","tr"]).default("en"),title:z.string().max(160),objective:z.string().max(1500).optional(),sourceRecordIds:z.array(z.string().uuid()).max(100).default([])}).passthrough()
export async function POST(request:Request){try{const input=schema.parse(await request.json());return generateResponse("presentation",input,input.sourceRecordIds)}catch(error){return invalid(error)}}
