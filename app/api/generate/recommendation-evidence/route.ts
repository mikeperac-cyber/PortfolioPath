import { z } from "zod"
import { invalid } from "@/lib/api-auth"
import { generateResponse } from "@/lib/generation/route"
const schema=z.object({projectId:z.string().uuid(),locale:z.enum(["en","tr"]).default("en"),completedActions:z.array(z.string().max(500)).max(100).default([]),reviewedEvidence:z.array(z.string().max(500)).max(100).default([]),confirmedSkills:z.array(z.string().max(80)).max(30).default([]),outcomes:z.array(z.string().max(500)).max(20).default([]),sourceRecordIds:z.array(z.string().uuid()).max(200).default([])}).passthrough()
export async function POST(request:Request){try{const input=schema.parse(await request.json());return generateResponse("recommendation_evidence",input,input.sourceRecordIds)}catch(error){return invalid(error)}}
