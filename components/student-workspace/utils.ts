import type { Project, Task, Evidence, Reflection, ProjectSkill } from "./types";

export function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function statusVariant(value: string) {
  return value === "complete" ||
    value === "accepted" ||
    value === "counselor_confirmed" ||
    value === "published"
    ? "default"
    : value.includes("review") ||
        value === "in_progress" ||
        value === "evidence_supported"
      ? "secondary"
      : ("outline" as const);
}
export function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "No date set";
}
export function skillName(row: ProjectSkill) {
  const skill = Array.isArray(row.skills) ? row.skills[0] : row.skills;
  return skill?.name_en ?? "Skill";
}
export function contentText(value: string | Record<string, unknown>) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

export function filterActiveProject(
  projects: Project[],
  tasks: Task[],
  evidence: Evidence[],
  reflections: Reflection[],
  skills: ProjectSkill[],
) {
  const activeProject =
    projects.find((project) =>
      [
        "active",
        "approved",
        "awaiting_counselor_review",
        "revision_requested",
        "draft",
      ].includes(project.status),
    ) ?? projects[0];
  const projectTasks = activeProject
    ? tasks.filter((task) => task.project_id === activeProject.id)
    : [];
  const projectEvidence = activeProject
    ? evidence.filter((item) => item.project_id === activeProject.id)
    : [];
  const projectReflections = activeProject
    ? reflections.filter(
        (item) => item.project_id === activeProject.id && item.submitted_at,
      )
    : [];
  const projectSkills = activeProject
    ? skills.filter((item) => item.project_id === activeProject.id)
    : [];
  return { activeProject, projectTasks, projectEvidence, projectReflections, projectSkills };
}