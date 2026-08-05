import { z } from "zod"
import { invalid } from "@/lib/api-auth"
import { generateResponse } from "@/lib/generation/route"

const schema = z.object({ projectId: z.string().uuid(), sourceRecordIds: z.array(z.string().uuid()).max(100).optional(), locale: z.enum(["en", "tr"]).default("en"), challenge: z.string().max(2000).optional(), majorConnection: z.string().max(1000).optional() })

export async function POST(request: Request) {
  try {
    return await generateResponse("portfolio_text", schema.parse(await request.json()))
  } catch (error) {
    return invalid(error)
  }
}
