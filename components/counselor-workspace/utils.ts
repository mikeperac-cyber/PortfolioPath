import type { Skill } from "./types";

export function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
export function variant(value: string) {
  return value === "approved" ||
    value === "accepted" ||
    value === "counselor_confirmed" ||
    value === "complete"
    ? "default"
    : value.includes("review") ||
        value === "pending" ||
        value === "evidence_supported"
      ? "secondary"
      : ("outline" as const);
}
export function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "No date";
}
export function skillName(row: Skill) {
  const skill = Array.isArray(row.skills) ? row.skills[0] : row.skills;
  return skill?.name_en ?? "Skill";
}