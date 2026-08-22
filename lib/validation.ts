import { z } from "zod"

export const localeSchema = z.enum(["en", "tr"])
const emailSchema = z.string().trim().max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Invalid email address")
export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(100),
  email: emailSchema,
  password: z.string().min(8).max(72).regex(/[a-z]/).regex(/[A-Z]/).regex(/[0-9]/),
  role: z.enum(["student", "counselor"]),
  locale: localeSchema,
})
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(8).max(72), locale: localeSchema })
export const onboardingSchema = z.object({
  fullName: z.string().min(2).max(100), age: z.coerce.number().int().min(14).max(19), schoolYear: z.string().min(1).max(40), city: z.string().min(2).max(80), country: z.string().min(2).max(80),
  targetApplicationYear: z.coerce.number().int().min(2026).max(2035), intendedMajor: z.string().max(120), weeklyHours: z.coerce.number().min(1).max(30), budgetTry: z.coerce.number().int().min(0).max(100000),
  interests: z.string().max(1000), activities: z.string().max(1000), causes: z.string().max(1000), previousExperiences: z.string().max(3000),
})
export const projectIdeaInputSchema = z.object({ interests: z.array(z.string().max(80)).min(1).max(12), intendedMajor: z.string().max(120), weeklyHours: z.number().min(1).max(30), budgetTry: z.number().int().min(0).max(100000), categories: z.array(z.string().uuid()).max(6), locale: localeSchema })
export const shareLinkSchema = z.object({ portfolioPageId: z.string().uuid(), expiresInDays: z.number().int().min(1).max(90) })
export const signedUploadSchema = z.object({ projectId: z.string().uuid(), fileName: z.string().min(1).max(180), mimeType: z.enum(["image/jpeg","image/png","image/webp","video/mp4","video/webm","audio/mpeg","audio/wav","audio/webm","application/pdf","text/plain","text/csv","application/vnd.openxmlformats-officedocument.wordprocessingml.document","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]), sizeBytes: z.number().int().positive().max(26_214_400) })
export const projectReviewSchema = z.object({ projectId: z.string().uuid(), decision: z.enum(["approved","revision_requested","rejected"]), reason: z.string().trim().min(10).max(2000) })
