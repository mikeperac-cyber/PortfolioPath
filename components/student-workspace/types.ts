export type Project = {
  id: string;
  title: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  main_objective: string | null;
  final_deliverable: string | null;
  updated_at: string;
};
export type Week = {
  id: string;
  project_id: string;
  week_number: number;
  milestone: string;
  starts_on: string | null;
  ends_on: string | null;
};
export type Task = {
  id: string;
  project_id: string;
  week_id: string | null;
  title: string;
  description: string | null;
  due_at: string | null;
  priority: string;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  status: string;
  obstacle_notes: string | null;
  student_reflection: string | null;
};
export type Evidence = {
  id: string;
  project_id: string;
  week_id: string | null;
  task_id: string | null;
  skill_id: string | null;
  title: string;
  description: string | null;
  evidence_type: string;
  storage_path: string | null;
  external_url: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  student_explanation: string | null;
  review_status: string;
  privacy: string;
  uploaded_at: string;
};
export type Reflection = {
  id: string;
  project_id: string;
  week_id: string | null;
  reflection_type: string;
  narrative: string | null;
  submitted_at: string | null;
  updated_at: string;
};
export type ProjectSkill = {
  id: string;
  project_id: string;
  status: string;
  skills:
    | { id?: string; name_en?: string; name_tr?: string }
    | Array<{ id?: string; name_en?: string; name_tr?: string }>
    | null;
};
export type Comment = {
  id: string;
  project_id: string;
  task_id: string | null;
  evidence_id: string | null;
  reflection_id: string | null;
  body: string;
  clarification_requested: boolean;
  created_at: string;
};
export type PortfolioSection = {
  id?: string;
  section_type: string;
  title: string;
  content: string | Record<string, unknown>;
  visible: boolean;
  sort_order: number;
};
export type Portfolio = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  confirmed_at: string | null;
  updated_at?: string;
  sections: PortfolioSection[];
};
export type WorkspaceData = {
  profile: {
    onboarding_completed?: boolean;
    intended_major?: string | null;
  } | null;
  projects: Project[];
  weeks: Week[];
  tasks: Task[];
  evidence: Evidence[];
  reflections: Reflection[];
  skills: ProjectSkill[];
  comments: Comment[];
  portfolios: Portfolio[];
  mentors: unknown[];
  parents: unknown[];
};