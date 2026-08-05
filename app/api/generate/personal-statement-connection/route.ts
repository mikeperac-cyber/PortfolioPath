import { z } from "zod"
import { invalid } from "@/lib/api-auth"
import { generateResponse } from "@/lib/generation/route"

const schema = z.object({ projectId: z.string().uuid(), sourceRecordIds: z.array(z.string().uuid()).max(100).optional(), locale: z.enum(["en", "tr"]).default("en") })

export async function POST(request: Request) {
  try {
    return await generateResponse("personal_statement_connection", schema.parse(await request.json()))
  } catch (error) {
    return invalid(error)
  }
}
