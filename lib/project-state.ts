import type { ProjectStatus } from "@/lib/domain"
const transitions:Record<ProjectStatus,readonly ProjectStatus[]>={draft:["awaiting_counselor_review","archived"],awaiting_counselor_review:["revision_requested","approved","archived"],revision_requested:["awaiting_counselor_review","archived"],approved:["active","archived"],active:["paused","completed","archived"],paused:["active","archived"],completed:["archived"],archived:[]}
export function canTransitionProject(from:ProjectStatus,to:ProjectStatus){return transitions[from].includes(to)}
export function assertProjectTransition(from:ProjectStatus,to:ProjectStatus){if(!canTransitionProject(from,to))throw new Error(`Invalid project status transition: ${from} → ${to}`)}
