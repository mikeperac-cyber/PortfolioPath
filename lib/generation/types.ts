import type { Provenance } from "@/lib/domain"
export type GenerationContext = { userId: string; projectId?: string; locale: "en" | "tr"; sourceRecordIds: string[] }
export type GeneratedResult<T> = { data: T; provenance: Provenance }
export interface GenerationProvider {
  projectIdeas(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<ProjectIdea[]>>
  presentation(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<PresentationDraft>>
  recommendationEvidence(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<RecommendationEvidence>>
  progressSummary(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<ProgressSummary>>
}
export type ProjectIdea = { title: string; category: string; description: string; fit: string; majorConnection: string; durationWeeks: number; weeklyHours: number; estimatedCostTry: number; finalDeliverable: string; expectedEvidence: string[]; targetSkills: string[]; measurableOutcomes: string[]; risks: string[]; ethicalNotes: string[]; suggestionOnly: true }
export type PresentationDraft = { pitch30: string; explanation90: string; presentation3m: string; interviewQuestions: string[]; answerNotes: string[] }
export type RecommendationEvidence = { warning: string; context: string; completedActions: string[]; initiativeEvidence: string[]; reliabilityEvidence: string[]; problemSolvingEvidence: string[]; resilienceEvidence: string[]; communicationEvidence: string[]; confirmedSkills: string[]; outcomes: string[] }
export type ProgressSummary = { period: string; completed: string[]; evidenceReviewed: string[]; reflections: string[]; counselorConfirmedSkills: string[]; concerns: string[]; nextSteps: string[] }
