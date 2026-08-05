import { z } from "zod"
import { invalid } from "@/lib/api-auth"
import { generateResponse } from "@/lib/generation/route"

const schema = z.object({ reflection: z.string().trim().min(20).max(5000), locale: z.enum(["en", "tr"]).default("en") })

export async function POST(request: Request) {
  try {
    return await generateResponse("reflection_support", schema.parse(await request.json()))
  } catch (error) {
    return invalid(error)
  }
}
