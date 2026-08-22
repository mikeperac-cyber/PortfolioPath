export const projectStatuses = ["draft", "awaiting_counselor_review", "revision_requested", "approved", "active", "paused", "completed", "archived"] as const
export type ProjectStatus = (typeof projectStatuses)[number]
export const taskStatuses = ["not_started", "in_progress", "blocked", "submitted_for_review", "complete"] as const
export type TaskStatus = (typeof taskStatuses)[number]
export const evidenceStatuses = ["pending", "accepted", "clarification_requested", "rejected", "privacy_concern"] as const
export type EvidenceStatus = (typeof evidenceStatuses)[number]
export type SkillStatus = "target" | "evidence_supported" | "counselor_confirmed"
export type Provenance = { sourceRecordIds: string[]; guidanceLabel: string; warnings: string[]; requiresFactualConfirmation: true }
export type GenerationType =
  | "project_ideas"
  | "project_blueprint"
  | "reflection_support"
  | "portfolio_text"
  | "presentation"
  | "recommendation_evidence"
  | "personal_statement_connection"
  | "interview_preparation"
  | "progress_summary"
  | "admissions_export"
