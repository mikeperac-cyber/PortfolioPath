import { projectIdeaInputSchema } from "@/lib/validation"
import { invalid } from "@/lib/api-auth"
import { generateResponse } from "@/lib/generation/route"
export async function POST(request:Request){try{const input=projectIdeaInputSchema.parse(await request.json());return generateResponse("project_ideas",input)}catch(error){return invalid(error)}}
