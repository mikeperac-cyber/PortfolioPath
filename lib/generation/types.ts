import type { Provenance } from "@/lib/domain"

export type GenerationContext = { userId: string; projectId?: string; locale: "en" | "tr"; sourceRecordIds: string[] }
export type GeneratedResult<T> = { data: T; provenance: Provenance }

export type ProjectIdea = {
  title: string
  category: string
  description: string
  fit: string
  majorConnection: string
  durationWeeks: number
  weeklyHours: number
  estimatedCostTry: number
  finalDeliverable: string
  expectedEvidence: string[]
  targetSkills: string[]
  measurableOutcomes: string[]
  risks: string[]
  ethicalNotes: string[]
  suggestionOnly: true
}

export type ProjectBlueprint = {
  summary: string
  primaryObjective: string
  secondaryObjectives: string[]
  successCriteria: string[]
  weeklyRoadmap: Array<{ week: number; milestone: string; tasks: string[]; estimatedHours: number; evidence: string[]; reflectionPrompt: string; obstacle: string; alternativeAction: string }>
  evidencePlan: string[]
  skillPlan: string[]
  risks: Array<{ risk: string; mitigation: string }>
  firstSevenActions: string[]
}

export type ReflectionSupport = {
  questions: string[]
  vagueLanguageFlags: string[]
  requestsForEvidence: string[]
  structureSuggestions: string[]
  studentOwnershipNotice: string
}

export type PortfolioText = {
  projectSummary: string
  process: string
  challenges: string
  outcomes: string
  skills: string
  intendedMajorConnection: string
  futureDevelopment: string
}

export type PresentationDraft = { pitch30: string; explanation90: string; presentation3m: string; interviewQuestions: string[]; answerNotes: string[] }
export type InterviewPreparation = { questions: string[]; answerPlanningNotes: string[]; challengingFollowUps: string[]; evidenceChecklist: string[] }
export type PersonalStatementConnection = { possibleThemes: string[]; sourceBackedMoments: string[]; reflectionQuestions: string[]; caution: string }
export type RecommendationEvidence = { warning: string; context: string; completedActions: string[]; initiativeEvidence: string[]; reliabilityEvidence: string[]; problemSolvingEvidence: string[]; resilienceEvidence: string[]; communicationEvidence: string[]; confirmedSkills: string[]; outcomes: string[] }
export type ProgressSummary = { period: string; completed: string[]; evidenceReviewed: string[]; reflections: string[]; counselorConfirmedSkills: string[]; concerns: string[]; nextSteps: string[] }

export interface GenerationProvider {
  projectIdeas(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<ProjectIdea[]>>
  projectBlueprint(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<ProjectBlueprint>>
  reflectionSupport(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<ReflectionSupport>>
  portfolioText(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<PortfolioText>>
  presentation(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<PresentationDraft>>
  recommendationEvidence(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<RecommendationEvidence>>
  personalStatementConnection(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<PersonalStatementConnection>>
  interviewPreparation(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<InterviewPreparation>>
  progressSummary(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<ProgressSummary>>
  admissionsExport(input: Record<string, unknown>, context: GenerationContext): Promise<GeneratedResult<AdmissionsExport>>
}

export interface AdmissionsExport {
  commonAppActivity: {
    position: string;
    organization: string;
    description: string;
    participationGradeLevels: string[];
    timingOfParticipation: string;
    hoursSpentPerWeek: number;
    weeksSpentPerYear: number;
  };
  ucPiqBulletPoints: string[];
  academicAbstract: string;
}
