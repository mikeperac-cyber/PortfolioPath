export type Entitlements = { idea_count?: number; project_limit?: number; student_limit?: number; workspace?: boolean; evidence?: boolean; reflections?: boolean; portfolio?: boolean; pdf?: boolean }
export function canCreateProject(entitlements: Entitlements, currentProjects: number) { return currentProjects < (entitlements.project_limit ?? 0) }
export function canAssignStudent(entitlements: Entitlements, currentStudents: number) { return currentStudents < (entitlements.student_limit ?? 0) }
export function projectIdeaLimit(entitlements: Entitlements) { return Math.max(1, Math.min(3, entitlements.idea_count ?? 1)) }
