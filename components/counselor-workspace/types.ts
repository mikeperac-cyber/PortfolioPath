export type Student = {
  id: string;
  name: string;
  accountStatus: string;
  intendedMajor: string;
  applicationYear: number | null;
  onboardingCompleted: boolean;
  overdueTasks: number;
  projectCount: number;
};
export type Project = {
  id: string;
  student_id: string;
  title: string;
  status: string;
  main_objective: string | null;
  updated_at: string;
};
export type Task = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  due_at: string | null;
  student_reflection: string | null;
  obstacle_notes: string | null;
  updated_at: string;
};
export type Evidence = {
  id: string;
  project_id: string;
  student_id: string;
  title: string;
  student_explanation: string | null;
  review_status: string;
  privacy: string;
  uploaded_at: string;
  skill_id: string | null;
};
export type Reflection = {
  id: string;
  project_id: string;
  student_id: string;
  reflection_type: string;
  narrative: string | null;
  submitted_at: string | null;
  updated_at: string;
};
export type Skill = {
  id: string;
  project_id: string;
  skill_id: string;
  status: string;
  skills: { name_en?: string } | Array<{ name_en?: string }> | null;
};
export type ReviewData = {
  students: Student[];
  projects: Project[];
  tasks: Task[];
  evidence: Evidence[];
  reflections: Reflection[];
  skills: Skill[];
};