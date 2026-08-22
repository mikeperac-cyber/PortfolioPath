import { z } from "zod"
import { invalid } from "@/lib/api-auth"
import { generateResponse } from "@/lib/generation/route"

const schema = z.object({
  title: z.string().optional(),
  objective: z.string().optional(),
  weeklyHours: z.number().optional(),
  durationWeeks: z.number().optional(),
  sourceRecordIds: z.array(z.string().uuid()).default([]),
})

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json())
    return await generateResponse("admissions_export", input, input.sourceRecordIds)
  } catch (error) {
    return invalid(error)
  }
}
