"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRightIcon,
  CheckCircle2Icon,
  Clock3Icon,
  FileArchiveIcon,
  LightbulbIcon,
  NotebookPenIcon,
  TargetIcon,
} from "lucide-react";
import { RelationshipManager } from "@/components/relationship-manager";
import { SectionHeader } from "@/components/section-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { WorkspaceData } from "./types";
import { filterActiveProject, humanize } from "./utils";

interface DashboardProps {
  data: WorkspaceData;
  locale: string;
  studentName: string;
}

export function Dashboard({ data, locale, studentName }: DashboardProps) {
  const firstName = studentName.trim().split(/\s+/)[0] || "Student";
  const {
    activeProject,
    projectTasks,
    projectEvidence,
    projectReflections,
    projectSkills,
  } = filterActiveProject(
    data.projects,
    data.tasks,
    data.evidence,
    data.reflections,
    data.skills,
  );
  const completeTasks = projectTasks.filter(
    (task) => task.status === "complete",
  ).length;
  const progress = projectTasks.length
    ? Math.round((completeTasks / projectTasks.length) * 100)
    : 0;
  const [now] = useState(() => Date.now());
  const due = projectTasks.filter(
    (task) =>
      task.status !== "complete" &&
      task.due_at &&
      new Date(task.due_at).getTime() <= now + 7 * 86_400_000,
  );
  const overdue = due.filter(
    (task) => task.due_at && new Date(task.due_at).getTime() < now,
  );
  const confirmedSkills = projectSkills.filter(
    (item) => item.status === "counselor_confirmed",
  ).length;
  const readiness = activeProject
    ? Math.round(
        ([
          Boolean(activeProject.main_objective),
          completeTasks > 0,
          projectEvidence.some((item) => item.review_status === "accepted"),
          projectReflections.length > 0,
          confirmedSkills > 0,
        ].filter(Boolean).length /
          5) *
          100,
      )
    : 0;
  const week = activeProject
    ? data.weeks.find((item) => item.project_id === activeProject.id)
    : null;

  return (
    <>
      <SectionHeader
        eyebrow="Student overview"
        title={`Welcome back, ${firstName}.`}
        description="Today's path keeps planned work, student-reported work, evidence, and confirmation visibly separate."
        action={
          <Button asChild>
            <Link href={`/${locale}/student/project-ideas`}>
              Explore project ideas
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        }
      />
      {!activeProject ? (
        <>
          <EmptyState
            icon={LightbulbIcon}
            title="Start with a real direction"
            description="Your workspace stays clear until you choose a genuine project. That prevents sample content from being mistaken for your achievements."
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild>
                  <Link href={`/${locale}/student/project-ideas`}>
                    Find project ideas
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/${locale}/student/projects/new`}>
                    Create manually
                  </Link>
                </Button>
              </div>
            }
          />
          <div className="mt-6">
            <RelationshipManager />
          </div>
        </>
      ) : (
        <>
          <Alert className="mb-6 border-accent/60 bg-accent/10">
            <TargetIcon />
            <AlertTitle>
              Next best action:{" "}
              {due[0]?.title ??
                "choose the smallest real action for this project"}
            </AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span>
                Complete the work yourself, then attach a dated item and a short
                student-authored reflection.
              </span>
              <Button size="sm" variant="outline" asChild>
                <Link href={`/${locale}/student/planner`}>
                  Open weekly plan
                  <ArrowRightIcon data-icon="inline-end" />
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              icon={Clock3Icon}
              label="Tasks due"
              value={due.length}
              detail={overdue.length ? `${overdue.length} overdue` : "Next seven days"}
            />
            <Metric
              icon={FileArchiveIcon}
              label="Evidence items"
              value={projectEvidence.length}
              detail={`${projectEvidence.filter((item) => item.review_status === "accepted").length} accepted`}
            />
            <Metric
              icon={NotebookPenIcon}
              label="Reflections"
              value={projectReflections.length}
              detail="Student-authored entries"
            />
            <Metric
              icon={TargetIcon}
              label="Confirmed skills"
              value={confirmedSkills}
              detail={`${projectSkills.length - confirmedSkills} still evidence-linked or targeted`}
            />
          </div>
          <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_.85fr]">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Badge variant="secondary">
                      {humanize(activeProject.status)}
                    </Badge>
                    <CardTitle className="mt-3">
                      {activeProject.title}
                    </CardTitle>
                    <CardDescription>
                      Planned objective:{" "}
                      {activeProject.main_objective ??
                        "Add an objective in the project blueprint."}
                    </CardDescription>
                  </div>
                  <p className="text-right text-3xl font-semibold text-primary">
                    {progress}%
                    <span className="mt-1 block text-xs font-normal text-muted-foreground">
                      task progress
                    </span>
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <Progress
                  value={progress}
                  aria-label={`Task progress: ${progress} percent`}
                />
                <div className="mt-6 rounded-lg border p-4">
                  <p className="text-xs font-semibold tracking-wide text-secondary uppercase">
                    Current milestone
                  </p>
                  <p className="mt-2 font-medium">
                    {week?.milestone ??
                      "Add weekly milestones in the project blueprint."}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {week
                      ? `Week ${week.week_number}`
                      : "No week is scheduled yet"}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild>
                  <Link href={`/${locale}/student/planner`}>
                    Continue this week
                    <ArrowRightIcon data-icon="inline-end" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Portfolio readiness</CardTitle>
                <CardDescription>
                  Completion only reflects factual, linked records.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <p className="text-4xl font-semibold text-primary">
                    {readiness}%
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Not an admissions score
                  </span>
                </div>
                <Progress className="mt-4" value={readiness} />
                <div className="mt-5 space-y-3 text-sm">
                  {[
                    [
                      "Plan has an objective",
                      Boolean(activeProject.main_objective),
                    ],
                    ["Completed task", completeTasks > 0],
                    [
                      "Accepted evidence",
                      projectEvidence.some(
                        (item) => item.review_status === "accepted",
                      ),
                    ],
                    ["Student reflection", projectReflections.length > 0],
                    ["Confirmed skill", confirmedSkills > 0],
                  ].map(([label, done]) => (
                    <p className="flex items-center gap-2" key={String(label)}>
                      {done ? (
                        <CheckCircle2Icon className="size-4 text-success" />
                      ) : (
                        <span className="size-4 rounded-full border" />
                      )}
                      <span>{label}</span>
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="mt-6">
            <RelationshipManager />
          </div>
        </>
      )}
    </>
  );
}

export function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Clock3Icon;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{value}</p>
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
        <Icon className="size-5 text-secondary" />
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof LightbulbIcon;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
        <Icon className="size-9 text-accent" />
        <h2 className="mt-4 text-xl font-semibold text-primary">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
        <div className="mt-6">{action}</div>
      </CardContent>
    </Card>
  );
}