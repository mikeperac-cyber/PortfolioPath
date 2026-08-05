import { z } from "zod"
import { invalid } from "@/lib/api-auth"
import { generateResponse } from "@/lib/generation/route"

const schema = z.object({ projectId: z.string().uuid(), locale: z.enum(["en", "tr"]).default("en"), weeklyHours: z.coerce.number().min(1).max(30).optional(), milestones: z.array(z.string().min(2).max(300)).max(24).optional() })

export async function POST(request: Request) {
  try {
    return await generateResponse("project_blueprint", schema.parse(await request.json()))
  } catch (error) {
    return invalid(error)
  }
}
