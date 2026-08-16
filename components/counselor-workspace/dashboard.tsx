"use client";

import {
  AlertTriangleIcon,
  ClipboardCheckIcon,
  Clock3Icon,
  FileArchiveIcon,
  FileCheck2Icon,
  MessageSquareTextIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Metric } from "./shared";
import { Roster } from "./roster";
import type { ReviewData } from "./types";

export function Dashboard({ data }: { data: ReviewData }) {
  const awaitingProjects = data.projects.filter(
    (project) => project.status === "awaiting_counselor_review",
  ).length;
  const awaitingTasks = data.tasks.filter(
    (task) => task.status === "submitted_for_review",
  ).length;
  const awaitingEvidence = data.evidence.filter(
    (item) => item.review_status === "pending",
  ).length;
  const overdue = data.students.filter(
    (student) => student.overdueTasks > 0,
  ).length;

  return (
    <>
      <SectionHeader
        eyebrow="Counselor overview"
        title="Review what needs judgment."
        description="A private, evidence-first queue for explicitly assigned students. Student source content stays read-only."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          icon={UsersIcon}
          label="Assigned students"
          value={data.students.length}
        />
        <Metric
          icon={FileCheck2Icon}
          label="Proposals"
          value={awaitingProjects}
        />
        <Metric icon={ClipboardCheckIcon} label="Tasks" value={awaitingTasks} />
        <Metric
          icon={FileArchiveIcon}
          label="Evidence"
          value={awaitingEvidence}
        />
        <Metric icon={Clock3Icon} label="Students overdue" value={overdue} />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
        <Roster data={data} />
        <Card>
          <CardHeader>
            <CardTitle>Review standard</CardTitle>
            <CardDescription>
              Use direct records and factual wording.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="flex gap-3">
              <ShieldCheckIcon className="size-4 shrink-0 text-success" />
              Confirm only skills connected to accepted evidence.
            </p>
            <p className="flex gap-3">
              <AlertTriangleIcon className="size-4 shrink-0 text-warning" />
              Ask for clarification when an impact claim is not supported.
            </p>
            <p className="flex gap-3">
              <MessageSquareTextIcon className="size-4 shrink-0 text-secondary" />
              Do not rewrite student source work as a counselor observation.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}