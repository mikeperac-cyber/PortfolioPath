"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircle2Icon,
  Clock3Icon,
  EyeIcon,
  FileArchiveIcon,
  FileTextIcon,
  LightbulbIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  MessageSquareTextIcon,
  NotebookPenIcon,
  PlusIcon,
  SaveIcon,
  SendIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
  UploadCloudIcon,
} from "lucide-react";
import { toast } from "sonner";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type Project = {
  id: string;
  title: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  main_objective: string | null;
  final_deliverable: string | null;
  updated_at: string;
};
type Week = {
  id: string;
  project_id: string;
  week_number: number;
  milestone: string;
  starts_on: string | null;
  ends_on: string | null;
};
type Task = {
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
type Evidence = {
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
type Reflection = {
  id: string;
  project_id: string;
  week_id: string | null;
  reflection_type: string;
  narrative: string | null;
  submitted_at: string | null;
  updated_at: string;
};
type ProjectSkill = {
  id: string;
  project_id: string;
  status: string;
  skills:
    | { id?: string; name_en?: string; name_tr?: string }
    | Array<{ id?: string; name_en?: string; name_tr?: string }>
    | null;
};
type Comment = {
  id: string;
  project_id: string;
  task_id: string | null;
  evidence_id: string | null;
  reflection_id: string | null;
  body: string;
  clarification_requested: boolean;
  created_at: string;
};
type PortfolioSection = {
  id?: string;
  section_type: string;
  title: string;
  content: string | Record<string, unknown>;
  visible: boolean;
  sort_order: number;
};
type Portfolio = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  confirmed_at: string | null;
  updated_at?: string;
  sections: PortfolioSection[];
};
type WorkspaceData = {
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

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function statusVariant(value: string) {
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
function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "No date set";
}
function skillName(row: ProjectSkill) {
  const skill = Array.isArray(row.skills) ? row.skills[0] : row.skills;
  return skill?.name_en ?? "Skill";
}
function contentText(value: string | Record<string, unknown>) {
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

function useWorkspace() {
  const [data, setData] = useState<WorkspaceData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/student/workspace", {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Your workspace could not be loaded.");
      setData(body);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Your workspace could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return { data, error, loading, refresh: load };
}

function EmptyState({
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

function Metric({
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

function LoadingWorkspace() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton className="h-36" key={index} />
      ))}
    </div>
  );
}

function Dashboard({
  data,
  locale,
  studentName,
}: {
  data: WorkspaceData;
  locale: string;
  studentName: string;
}) {
  const firstName = studentName.trim().split(/\s+/)[0] || "Student";
  const activeProject =
    data.projects.find((project) =>
      [
        "active",
        "approved",
        "awaiting_counselor_review",
        "revision_requested",
        "draft",
      ].includes(project.status),
    ) ?? data.projects[0];
  const projectTasks = activeProject
    ? data.tasks.filter((task) => task.project_id === activeProject.id)
    : [];
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
  const evidence = activeProject
    ? data.evidence.filter((item) => item.project_id === activeProject.id)
    : [];
  const reflections = activeProject
    ? data.reflections.filter(
        (item) => item.project_id === activeProject.id && item.submitted_at,
      )
    : [];
  const skills = activeProject
    ? data.skills.filter((item) => item.project_id === activeProject.id)
    : [];
  const confirmedSkills = skills.filter(
    (item) => item.status === "counselor_confirmed",
  ).length;
  const readiness = activeProject
    ? Math.round(
        ([
          Boolean(activeProject.main_objective),
          completeTasks > 0,
          evidence.some((item) => item.review_status === "accepted"),
          reflections.length > 0,
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
        description="Today’s path keeps planned work, student-reported work, evidence, and confirmation visibly separate."
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
              detail={
                overdue.length ? `${overdue.length} overdue` : "Next seven days"
              }
            />
            <Metric
              icon={FileArchiveIcon}
              label="Evidence items"
              value={evidence.length}
              detail={`${evidence.filter((item) => item.review_status === "accepted").length} accepted`}
            />
            <Metric
              icon={NotebookPenIcon}
              label="Reflections"
              value={reflections.length}
              detail="Student-authored entries"
            />
            <Metric
              icon={TargetIcon}
              label="Confirmed skills"
              value={confirmedSkills}
              detail={`${skills.length - confirmedSkills} still evidence-linked or targeted`}
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
                      evidence.some(
                        (item) => item.review_status === "accepted",
                      ),
                    ],
                    ["Student reflection", reflections.length > 0],
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

function Projects({
  data,
  locale,
  refresh,
}: {
  data: WorkspaceData;
  locale: string;
  refresh: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState<string | null>(null);
  async function submit(projectId: string) {
    setSubmitting(projectId);
    try {
      const response = await fetch(`/api/projects/${projectId}/submit`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Project could not be submitted.");
      toast.success("Project submitted for counselor review.");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Project could not be submitted.",
      );
    } finally {
      setSubmitting(null);
    }
  }
  return (
    <>
      <SectionHeader
        eyebrow="Project studio"
        title="My projects"
        description="Plans remain plans until tasks and evidence support a completed statement."
        action={
          <Button asChild>
            <Link href={`/${locale}/student/projects/new`}>
              <PlusIcon data-icon="inline-start" />
              New project
            </Link>
          </Button>
        }
      />
      {!data.projects.length ? (
        <EmptyState
          icon={LightbulbIcon}
          title="No projects yet"
          description="Choose a genuine direction or create a project manually. Your weekly plan begins only after the project is saved."
          action={
            <Button asChild>
              <Link href={`/${locale}/student/project-ideas`}>
                Explore project ideas
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {data.projects.map((project) => {
            const tasks = data.tasks.filter(
              (task) => task.project_id === project.id,
            );
            const done = tasks.filter(
              (task) => task.status === "complete",
            ).length;
            const evidence = data.evidence.filter(
              (item) => item.project_id === project.id,
            );
            return (
              <Card key={project.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant={statusVariant(project.status)}>
                        {humanize(project.status)}
                      </Badge>
                      <CardTitle className="mt-3">{project.title}</CardTitle>
                      <CardDescription>
                        Planned dates: {formatDate(project.start_date)} –{" "}
                        {formatDate(project.end_date)}
                      </CardDescription>
                    </div>
                    <p className="text-right text-sm text-muted-foreground">
                      {done}/{tasks.length}
                      <br />
                      tasks complete
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div>
                    <p className="text-sm font-medium">Planned objective</p>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {project.main_objective ?? "No objective recorded."}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">Evidence</p>
                      <p className="mt-1 text-xl font-semibold">
                        {evidence.length}
                      </p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground">
                        Final deliverable
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-medium">
                        {project.final_deliverable ?? "Not yet set"}
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3">
                  <Button variant="outline" asChild>
                    <Link href={`/${locale}/student/planner`}>Open plan</Link>
                  </Button>
                  {["draft", "revision_requested"].includes(project.status) ? (
                    <Button
                      disabled={submitting === project.id}
                      onClick={() => void submit(project.id)}
                    >
                      {submitting === project.id ? (
                        <LoaderCircleIcon
                          data-icon="inline-start"
                          className="animate-spin"
                        />
                      ) : (
                        <SendIcon data-icon="inline-start" />
                      )}
                      Submit for review
                    </Button>
                  ) : null}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function TaskRow({
  task,
  onSaved,
}: {
  task: Task;
  onSaved: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [actualMinutes, setActualMinutes] = useState(
    task.actual_minutes?.toString() ?? "",
  );
  async function update(changes: Record<string, unknown>) {
    setBusy(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(changes),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Task could not be updated.");
      await onSaved();
      toast.success("Task updated.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Task could not be updated.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col justify-between gap-4 md:flex-row">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{task.title}</p>
            <Badge variant={statusVariant(task.status)}>
              {humanize(task.status)}
            </Badge>
            <Badge variant="outline">{task.priority}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {task.description ?? "Add a concrete action and document it."}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Due {formatDate(task.due_at)} · Planned{" "}
            {task.estimated_minutes ?? 0} min
          </p>
        </div>
        <div className="grid min-w-52 gap-3 sm:grid-cols-2 md:grid-cols-1">
          <Select
            value={task.status}
            onValueChange={(status) => void update({ status })}
            disabled={busy}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[
                "not_started",
                "in_progress",
                "blocked",
                "submitted_for_review",
                "complete",
              ].map((status) => (
                <SelectItem key={status} value={status}>
                  {humanize(status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input
              aria-label="Actual minutes"
              type="number"
              min={0}
              value={actualMinutes}
              onChange={(event) => setActualMinutes(event.target.value)}
              placeholder="Actual min"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void update({
                  actualMinutes: actualMinutes ? Number(actualMinutes) : null,
                })
              }
            >
              <SaveIcon />
            </Button>
          </div>
        </div>
      </div>
      {task.status === "blocked" ? (
        <p className="mt-4 rounded-md bg-warning/10 p-3 text-sm text-warning">
          Record the obstacle in your reflection or task notes, then choose a
          smaller alternative action. A blocked task is not a failure.
        </p>
      ) : null}
    </div>
  );
}

function Planner({
  data,
  locale,
  refresh,
}: {
  data: WorkspaceData;
  locale: string;
  refresh: () => Promise<void>;
}) {
  const groups = data.projects.map((project) => ({
    project,
    tasks: data.tasks.filter((task) => task.project_id === project.id),
    weeks: data.weeks.filter((week) => week.project_id === project.id),
  }));
  return (
    <>
      <SectionHeader
        eyebrow="Weekly path"
        title="Planner"
        description="Complete one real task at a time. ‘Submitted for review’ is different from counselor approval."
      />
      {!data.tasks.length ? (
        <EmptyState
          icon={Clock3Icon}
          title="No weekly tasks yet"
          description="Create a real project first. Its milestones become manageable weekly tasks instead of a vague checklist."
          action={
            <Button asChild>
              <Link href={`/${locale}/student/projects/new`}>
                Create project
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {groups
            .filter((group) => group.tasks.length)
            .map(({ project, tasks, weeks }) => (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{project.title}</CardTitle>
                      <CardDescription>
                        Tasks remain student-owned; review never overwrites your
                        source work.
                      </CardDescription>
                    </div>
                    <Badge variant={statusVariant(project.status)}>
                      {humanize(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tasks.map((task) => {
                    const week = weeks.find((item) => item.id === task.week_id);
                    return (
                      <div key={task.id}>
                        <p className="mb-2 text-xs font-semibold tracking-wide text-secondary uppercase">
                          {week
                            ? `Week ${week.week_number}: ${week.milestone}`
                            : "Project task"}
                        </p>
                        <TaskRow task={task} onSaved={refresh} />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </>
  );
}

function EvidenceVault({
  data,
  refresh,
}: {
  data: WorkspaceData;
  refresh: () => Promise<void>;
}) {
  const initialProject = data.projects[0]?.id ?? "";
  const [projectId, setProjectId] = useState(initialProject);
  const [taskId, setTaskId] = useState("none");
  const [title, setTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [privacy, setPrivacy] = useState("private");
  const [busy, setBusy] = useState(false);
  const projectTasks = data.tasks.filter(
    (task) => task.project_id === projectId,
  );
  async function upload() {
    if (!projectId) return toast.error("Choose a project first.");
    if (!title.trim() || !explanation.trim())
      return toast.error(
        "Add a clear title and explain what the evidence supports.",
      );
    if (!file && !externalUrl.trim())
      return toast.error("Choose a file or add a valid external link.");
    setBusy(true);
    try {
      let storagePath: string | undefined;
      if (file) {
        const signed = await fetch("/api/evidence/sign-upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            projectId,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        });
        const signedBody = await signed.json();
        if (!signed.ok)
          throw new Error(
            signedBody.error ?? "Upload authorization could not be created.",
          );
        const stored = await fetch(signedBody.signedUrl, {
          method: "PUT",
          headers: { "content-type": file.type },
          body: file,
        });
        if (!stored.ok)
          throw new Error("The private file could not be uploaded.");
        storagePath = signedBody.path;
      }
      const type = file
        ? file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : file.type === "application/pdf"
              ? "pdf"
              : file.type.includes("sheet") || file.type === "text/csv"
                ? "spreadsheet"
                : "document"
        : externalUrl.includes("github.com")
          ? "repository"
          : "website";
      const response = await fetch("/api/evidence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          taskId: taskId === "none" ? null : taskId,
          title,
          explanation,
          evidenceType: type,
          storagePath,
          externalUrl: externalUrl || undefined,
          mimeType: file?.type,
          sizeBytes: file?.size,
          privacy,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Evidence could not be saved.");
      toast.success("Private evidence saved with its provenance.");
      setTitle("");
      setExplanation("");
      setExternalUrl("");
      setFile(null);
      setTaskId("none");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Evidence could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function openEvidence(item: Evidence) {
    if (item.external_url)
      return window.open(item.external_url, "_blank", "noopener,noreferrer");
    if (!item.storage_path) return;
    try {
      const response = await fetch("/api/evidence/sign-download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ evidenceId: item.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "File could not be opened.",
      );
    }
  }
  return (
    <>
      <SectionHeader
        eyebrow="Private evidence vault"
        title="Show the work"
        description="Each item keeps its date, uploader, review state, privacy setting, and your explanation. It is private unless you select it for a portfolio."
      />
      {!data.projects.length ? (
        <EmptyState
          icon={FileArchiveIcon}
          title="Create a project before uploading"
          description="Evidence must always belong to a real project, not a sample or an unconnected folder."
          action={
            <Button asChild>
              <Link href="/en/student/projects/new">Create project</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Add one evidence item</CardTitle>
              <CardDescription>
                Upload original work or attach a responsible external link. A
                file cannot prove a claim without your explanation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Project</FieldLabel>
                  <Select
                    value={projectId}
                    onValueChange={(value) => {
                      setProjectId(value);
                      setTaskId("none");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {data.projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Related task (optional)</FieldLabel>
                  <Select value={taskId} onValueChange={setTaskId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific task</SelectItem>
                      {projectTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="evidence-file">
                    Private file (optional if using a link)
                  </FieldLabel>
                  <Input
                    id="evidence-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf,.docx,.xlsx,.csv"
                    onChange={(event) =>
                      setFile(event.target.files?.[0] ?? null)
                    }
                  />
                  <FieldDescription>
                    PNG, JPG, WebP, MP4, PDF, DOCX, XLSX, or CSV; maximum 25 MB.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="evidence-link">
                    External link (optional)
                  </FieldLabel>
                  <Input
                    id="evidence-link"
                    type="url"
                    value={externalUrl}
                    onChange={(event) => setExternalUrl(event.target.value)}
                    placeholder="https://…"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="evidence-title">Title</FieldLabel>
                  <Input
                    id="evidence-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Week 2 observation notes"
                  />
                </Field>
                <Field>
                  <FieldLabel>Privacy</FieldLabel>
                  <Select value={privacy} onValueChange={setPrivacy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">
                        Private to me and my counselor
                      </SelectItem>
                      <SelectItem value="portfolio_selected">
                        Selected for my portfolio
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="evidence-explanation">
                    What does this item show?
                  </FieldLabel>
                  <Textarea
                    id="evidence-explanation"
                    rows={5}
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                    placeholder="State what you personally did, observed, created, or changed. Avoid claims the file cannot support."
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="justify-between gap-4 border-t">
              <p className="flex max-w-lg items-start gap-2 text-xs leading-5 text-muted-foreground">
                <LockKeyholeIcon className="mt-0.5 size-4 shrink-0" />
                Files are private by default and use short-lived upload/download
                access.
              </p>
              <Button disabled={busy} onClick={() => void upload()}>
                {busy ? (
                  <LoaderCircleIcon
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                ) : (
                  <UploadCloudIcon data-icon="inline-start" />
                )}
                Save private evidence
              </Button>
            </CardFooter>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your evidence</CardTitle>
              <CardDescription>
                Accepted evidence can later support portfolio statements; it
                does not automatically prove impact.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.evidence.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Privacy</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.evidence.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 max-w-md text-xs text-muted-foreground">
                            {item.student_explanation}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(item.review_status)}>
                            {humanize(item.review_status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {humanize(item.privacy)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.uploaded_at)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void openEvidence(item)}
                          >
                            <EyeIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No evidence has been uploaded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

function Reflections({
  data,
  refresh,
}: {
  data: WorkspaceData;
  refresh: () => Promise<void>;
}) {
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? "");
  const [type, setType] = useState("weekly");
  const [narrative, setNarrative] = useState("");
  const [busy, setBusy] = useState(false);
  const [support, setSupport] = useState<string[]>([]);
  const existing = useMemo(
    () =>
      data.reflections.find(
        (reflection) =>
          reflection.project_id === projectId &&
          reflection.reflection_type === type,
      ),
    [data.reflections, projectId, type],
  );
  useEffect(() => {
    const timer = window.setTimeout(
      () => setNarrative(existing?.narrative ?? ""),
      0,
    );
    return () => window.clearTimeout(timer);
  }, [existing?.narrative, projectId, type]);
  async function save() {
    if (!projectId) return toast.error("Choose a project first.");
    setBusy(true);
    try {
      const response = await fetch("/api/reflections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          id: existing?.id,
          projectId,
          reflectionType: type,
          narrative,
          submit: true,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Reflection could not be saved.");
      toast.success("Student-authored reflection saved.");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Reflection could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function requestSupport() {
    if (narrative.trim().length < 20)
      return toast.error(
        "Write a first draft before requesting reflection prompts.",
      );
    try {
      const response = await fetch("/api/generate/reflection-support", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reflection: narrative, locale: "en" }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Guidance could not be generated.");
      setSupport([
        ...(body.data.questions ?? []),
        ...(body.data.requestsForEvidence ?? []),
      ]);
      toast.success("Reflection prompts are ready.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Guidance could not be generated.",
      );
    }
  }
  return (
    <>
      <SectionHeader
        eyebrow="Student-authored"
        title="Reflection journal"
        description="Use concrete examples. Guidance can ask questions, but it never writes a fictional reflection for you."
      />
      {!data.projects.length ? (
        <EmptyState
          icon={NotebookPenIcon}
          title="Reflection starts after real work"
          description="Create a project and complete a meaningful action first. Reflections should not be manufactured in advance."
          action={
            <Button asChild>
              <Link href="/en/student/projects/new">Create project</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Write about your process</CardTitle>
            <CardDescription>
              Describe what you completed, what changed, a decision, the
              evidence, and your next action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Project</FieldLabel>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {data.projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel>Reflection type</FieldLabel>
                <Tabs value={type} onValueChange={setType}>
                  <TabsList>
                    <TabsTrigger value="weekly">Weekly</TabsTrigger>
                    <TabsTrigger value="midpoint">Midpoint</TabsTrigger>
                    <TabsTrigger value="final">Final</TabsTrigger>
                  </TabsList>
                </Tabs>
              </Field>
              <Field>
                <FieldLabel htmlFor="reflection-narrative">
                  Your reflection
                </FieldLabel>
                <Textarea
                  id="reflection-narrative"
                  rows={11}
                  value={narrative}
                  onChange={(event) => setNarrative(event.target.value)}
                  placeholder="Use your own words and concrete examples from the work you actually did…"
                />
                <FieldDescription>
                  Clearly stored as a student-authored statement, not an AI
                  assessment.
                </FieldDescription>
              </Field>
            </FieldGroup>
            {support.length ? (
              <Alert className="mt-5">
                <SparklesIcon />
                <AlertTitle>Questions to deepen your own reflection</AlertTitle>
                <AlertDescription>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    {support.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="flex-wrap justify-between gap-3 border-t">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => void requestSupport()}
            >
              <SparklesIcon data-icon="inline-start" />
              Get question prompts
            </Button>
            <Button
              disabled={busy || narrative.trim().length < 30}
              onClick={() => void save()}
            >
              {busy ? (
                <LoaderCircleIcon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <SaveIcon data-icon="inline-start" />
              )}
              Save reflection
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}

function Skills({ data }: { data: WorkspaceData }) {
  return (
    <>
      <SectionHeader
        eyebrow="Evidence-linked"
        title="Skills tracker"
        description="Only three states are used: target, evidence-supported, and counselor-confirmed. There are no AI percentages."
      />
      {!data.skills.length ? (
        <EmptyState
          icon={TargetIcon}
          title="No target skills recorded yet"
          description="Add target skills while creating or revising a project. A skill moves only when evidence and then counselor confirmation support it."
          action={
            <Button asChild>
              <Link href="/en/student/projects">Review projects</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Connected evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.skills.map((row) => {
                  const project = data.projects.find(
                    (item) => item.id === row.project_id,
                  );
                  const skill = Array.isArray(row.skills)
                    ? row.skills[0]
                    : row.skills;
                  const linked = skill?.id
                    ? data.evidence.filter((item) => item.skill_id === skill.id)
                        .length
                    : 0;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {skillName(row)}
                      </TableCell>
                      <TableCell>{project?.title ?? "Project"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)}>
                          {humanize(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {linked
                          ? `${linked} item${linked === 1 ? "" : "s"}`
                          : "No linked evidence yet"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function Feedback({ data }: { data: WorkspaceData }) {
  return (
    <>
      <SectionHeader
        eyebrow="Factual counselor review"
        title="Counselor feedback"
        description="Counselors can request clarification and confirm evidence. They cannot replace your source work or write your story for you."
      />
      {!data.comments.length ? (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="No feedback yet"
          description="Comments appear after a counselor has access to your assigned project and reviews a proposal, task, evidence item, or reflection."
          action={<Badge variant="outline">No review activity</Badge>}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {data.comments.map((comment) => {
            const project = data.projects.find(
              (item) => item.id === comment.project_id,
            );
            return (
              <Card key={comment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>
                        {project?.title ?? "Project feedback"}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(comment.created_at)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        comment.clarification_requested
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {comment.clarification_requested
                        ? "Clarification requested"
                        : "Comment"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {comment.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function PortfolioBuilder({
  data,
  refresh,
}: {
  data: WorkspaceData;
  refresh: () => Promise<void>;
}) {
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? "");
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/portfolio/${projectId}`, {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Portfolio could not be loaded.");
      setPortfolio(
        body.portfolio
          ? { ...body.portfolio, sections: body.portfolio.sections ?? [] }
          : null,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Portfolio could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  async function create() {
    setBusy(true);
    try {
      const response = await fetch(`/api/portfolio/${projectId}`, {
        method: "POST",
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Portfolio draft could not be created.");
      toast.success("Portfolio draft created from your current records.");
      await load();
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Portfolio draft could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }
  function updateSection(index: number, changes: Partial<PortfolioSection>) {
    if (!portfolio) return;
    setPortfolio({
      ...portfolio,
      sections: portfolio.sections.map((section, current) =>
        current === index ? { ...section, ...changes } : section,
      ),
    });
  }
  function move(index: number, direction: -1 | 1) {
    if (!portfolio) return;
    const target = index + direction;
    if (target < 0 || target >= portfolio.sections.length) return;
    const sections = [...portfolio.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    setPortfolio({
      ...portfolio,
      sections: sections.map((section, sortOrder) => ({
        ...section,
        sort_order: sortOrder,
      })),
    });
  }
  async function save(confirm = false) {
    if (!portfolio) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/portfolio/${projectId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sections: portfolio.sections.map((section, sortOrder) => ({
            sectionType: section.section_type,
            title: section.title,
            content: contentText(section.content),
            visible: section.visible,
            sortOrder,
          })),
          confirmFactualAccuracy: confirm,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Portfolio could not be saved.");
      setPortfolio({
        ...portfolio,
        status: body.portfolio.status,
        confirmed_at: body.portfolio.confirmed_at,
      });
      toast.success(
        confirm
          ? "Factual accuracy confirmed. Private sharing is now available."
          : "Portfolio draft saved.",
      );
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Portfolio could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function share() {
    if (!portfolio) return;
    try {
      const response = await fetch("/api/share-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          portfolioPageId: portfolio.id,
          expiresInDays: 30,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Share link could not be created.");
      setShareUrl(body.url);
      toast.success("Private 30-day share link created.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Share link could not be created.",
      );
    }
  }
  return (
    <>
      <SectionHeader
        eyebrow="Private portfolio"
        title="Portfolio builder"
        description="Editable sections are drafted from your records. You must confirm factual accuracy before publishing, exporting, or sharing."
      />
      {!data.projects.length ? (
        <EmptyState
          icon={FileTextIcon}
          title="Create a project first"
          description="Portfolio pages are never generated from sample achievements or unconnected files."
          action={
            <Button asChild>
              <Link href="/en/student/projects/new">Create project</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Select project</CardTitle>
              <CardDescription>
                Only accepted evidence marked “selected for my portfolio” can
                appear in a shareable portfolio.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="max-w-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {data.projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          {loading ? (
            <Skeleton className="mt-6 h-96" />
          ) : !portfolio ? (
            <EmptyState
              icon={FileTextIcon}
              title="No portfolio draft yet"
              description="Create an editable draft from the project’s approved description, completed tasks, selected accepted evidence, reflections, outcomes, and confirmed skills."
              action={
                <Button disabled={busy} onClick={() => void create()}>
                  {busy ? (
                    <LoaderCircleIcon
                      data-icon="inline-start"
                      className="animate-spin"
                    />
                  ) : (
                    <SparklesIcon data-icon="inline-start" />
                  )}
                  Create factual draft
                </Button>
              }
            />
          ) : (
            <div className="mt-6 grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
              <Card>
                <CardHeader>
                  <CardTitle>Section controls</CardTitle>
                  <CardDescription>
                    Reorder or hide sections before sharing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {portfolio.sections.map((section, index) => (
                    <div
                      className="flex items-center gap-2 rounded-lg border p-3"
                      key={section.section_type}
                    >
                      <Checkbox
                        checked={section.visible}
                        onCheckedChange={(visible) =>
                          updateSection(index, { visible: Boolean(visible) })
                        }
                      />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        {section.title}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={index === 0}
                        onClick={() => move(index, -1)}
                      >
                        <ArrowUpIcon />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        disabled={index === portfolio.sections.length - 1}
                        onClick={() => move(index, 1)}
                      >
                        <ArrowDownIcon />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{portfolio.title}</CardTitle>
                      <CardDescription>
                        {portfolio.confirmed_at
                          ? "Factual accuracy confirmed"
                          : "Private editable draft"}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={portfolio.confirmed_at ? "default" : "outline"}
                    >
                      {humanize(portfolio.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {portfolio.sections.map((section, index) => (
                    <div
                      className={section.visible ? "" : "opacity-50"}
                      key={section.section_type}
                    >
                      <FieldLabel htmlFor={`section-${index}`}>
                        {section.title}
                      </FieldLabel>
                      <Textarea
                        id={`section-${index}`}
                        rows={Math.max(
                          3,
                          Math.min(
                            8,
                            contentText(section.content).split("\n").length + 1,
                          ),
                        )}
                        value={contentText(section.content)}
                        onChange={(event) =>
                          updateSection(index, { content: event.target.value })
                        }
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {section.visible
                          ? "Visible in private preview"
                          : "Hidden from private preview"}
                      </p>
                    </div>
                  ))}
                </CardContent>
                <CardFooter className="flex-wrap justify-between gap-3 border-t">
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => void save(false)}
                  >
                    <SaveIcon data-icon="inline-start" />
                    Save draft
                  </Button>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled={busy} onClick={() => void save(true)}>
                      <ShieldCheckIcon data-icon="inline-start" />
                      Confirm factual accuracy
                    </Button>
                    {portfolio.confirmed_at ? (
                      <Button variant="outline" onClick={() => void share()}>
                        <LockKeyholeIcon data-icon="inline-start" />
                        Create 30-day link
                      </Button>
                    ) : null}
                  </div>
                </CardFooter>
                {shareUrl ? (
                  <CardContent className="border-t">
                    <Alert>
                      <LockKeyholeIcon />
                      <AlertTitle>Private share link</AlertTitle>
                      <AlertDescription className="break-all">
                        {shareUrl}
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                ) : null}
              </Card>
            </div>
          )}
        </>
      )}
    </>
  );
}

function GeneratedMaterials({
  data,
  mode,
}: {
  data: WorkspaceData;
  mode: "presentation" | "recommendation" | "application";
}) {
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState<unknown>(null);
  const config =
    mode === "presentation"
      ? {
          title: "Presentation builder",
          description:
            "Create editable, evidence-based speaking notes—not a performance script you cannot honestly deliver.",
          endpoints: ["/api/generate/presentation"],
        }
      : mode === "recommendation"
        ? {
            title: "Recommendation evidence",
            description:
              "A factual evidence summary for a recommender. It is not a recommendation letter.",
            endpoints: ["/api/generate/recommendation-evidence"],
          }
        : {
            title: "Application preparation",
            description:
              "Find source-backed personal-statement themes and practise factual interview answers.",
            endpoints: [
              "/api/generate/personal-statement-connection",
              "/api/generate/interview-preparation",
            ],
          };
  async function generate() {
    if (!projectId) return toast.error("Choose a project first.");
    setBusy(true);
    try {
      const results = await Promise.all(
        config.endpoints.map(async (endpoint) => {
          const response = await fetch(endpoint, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ projectId, locale: "en" }),
          });
          const body = await response.json();
          if (!response.ok)
            throw new Error(body.error ?? "Draft could not be generated.");
          return body.data;
        }),
      );
      setOutput(results.length === 1 ? results[0] : results);
      toast.success("Editable guidance created from eligible project records.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Draft could not be generated.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SectionHeader
        eyebrow="Editable guidance"
        title={config.title}
        description={config.description}
      />
      {mode === "recommendation" ? (
        <Alert className="mb-6">
          <ShieldCheckIcon />
          <AlertTitle>Required warning</AlertTitle>
          <AlertDescription>
            This document provides evidence for a recommender. It is not a
            recommendation letter and must not contain invented observations.
          </AlertDescription>
        </Alert>
      ) : null}
      {!data.projects.length ? (
        <EmptyState
          icon={SparklesIcon}
          title="No project source records yet"
          description="These drafts are unlocked only after a project has factual source records. PortfolioPath will not invent achievements, impact, observations, or admissions value."
          action={
            <Button asChild>
              <Link href="/en/student/projects/new">Create project</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Choose a project</CardTitle>
            <CardDescription>
              Generation uses completed tasks, accepted evidence, submitted
              reflections, supported outcomes, and confirmed skills only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger className="max-w-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {output ? (
              <div className="mt-6 rounded-lg border bg-muted/30 p-5">
                <p className="mb-3 flex items-center gap-2 text-sm font-medium">
                  <SparklesIcon className="size-4 text-secondary" />
                  Editable draft — verify every factual statement
                </p>
                <pre className="overflow-x-auto whitespace-pre-wrap font-sans text-sm leading-6 text-muted-foreground">
                  {JSON.stringify(output, null, 2)}
                </pre>
              </div>
            ) : null}
          </CardContent>
          <CardFooter>
            <Button disabled={busy} onClick={() => void generate()}>
              {busy ? (
                <LoaderCircleIcon
                  data-icon="inline-start"
                  className="animate-spin"
                />
              ) : (
                <SparklesIcon data-icon="inline-start" />
              )}
              Generate editable guidance
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}

export function LiveStudentWorkspace({
  section,
  locale,
  studentName,
}: {
  section: string;
  locale: string;
  studentName: string;
}) {
  const workspace = useWorkspace();
  if (workspace.loading) return <LoadingWorkspace />;
  if (workspace.error || !workspace.data)
    return (
      <Alert variant="destructive">
        <FileArchiveIcon />
        <AlertTitle>Student workspace unavailable</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>
            {workspace.error || "Your workspace could not be loaded."}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void workspace.refresh()}
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  const data = workspace.data;
  if (section === "dashboard")
    return <Dashboard data={data} locale={locale} studentName={studentName} />;
  if (section === "projects")
    return <Projects data={data} locale={locale} refresh={workspace.refresh} />;
  if (section === "planner")
    return <Planner data={data} locale={locale} refresh={workspace.refresh} />;
  if (section === "evidence")
    return <EvidenceVault data={data} refresh={workspace.refresh} />;
  if (section === "reflections")
    return <Reflections data={data} refresh={workspace.refresh} />;
  if (section === "skills") return <Skills data={data} />;
  if (section === "feedback") return <Feedback data={data} />;
  if (section === "portfolio")
    return <PortfolioBuilder data={data} refresh={workspace.refresh} />;
  if (section === "presentation")
    return <GeneratedMaterials data={data} mode="presentation" />;
  if (section === "recommendation-evidence")
    return <GeneratedMaterials data={data} mode="recommendation" />;
  if (section === "application-prep")
    return <GeneratedMaterials data={data} mode="application" />;
  return null;
}
