"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  ClipboardCheckIcon,
  Clock3Icon,
  FileArchiveIcon,
  FileCheck2Icon,
  FilterIcon,
  LoaderCircleIcon,
  MessageSquareTextIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
  UsersIcon,
} from "lucide-react";
import { toast } from "sonner";
import { BillingCheckout } from "@/components/billing-checkout";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";

type Student = {
  id: string;
  name: string;
  accountStatus: string;
  intendedMajor: string;
  applicationYear: number | null;
  onboardingCompleted: boolean;
  overdueTasks: number;
  projectCount: number;
};
type Project = {
  id: string;
  student_id: string;
  title: string;
  status: string;
  main_objective: string | null;
  updated_at: string;
};
type Task = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  due_at: string | null;
  student_reflection: string | null;
  obstacle_notes: string | null;
  updated_at: string;
};
type Evidence = {
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
type Reflection = {
  id: string;
  project_id: string;
  student_id: string;
  reflection_type: string;
  narrative: string | null;
  submitted_at: string | null;
  updated_at: string;
};
type Skill = {
  id: string;
  project_id: string;
  skill_id: string;
  status: string;
  skills: { name_en?: string } | Array<{ name_en?: string }> | null;
};
type ReviewData = {
  students: Student[];
  projects: Project[];
  tasks: Task[];
  evidence: Evidence[];
  reflections: Reflection[];
  skills: Skill[];
};

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
function variant(value: string) {
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
function date(value: string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
        new Date(value),
      )
    : "No date";
}
function skillName(row: Skill) {
  const skill = Array.isArray(row.skills) ? row.skills[0] : row.skills;
  return skill?.name_en ?? "Skill";
}

function useReviewData() {
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/counselor/dashboard", {
        cache: "no-store",
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Review data could not be loaded.");
      setData(body);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Review data could not be loaded.",
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
  return { data, loading, error, refresh: load };
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{value}</p>
        </div>
        <Icon className="size-5 text-secondary" />
      </CardContent>
    </Card>
  );
}

function EmptyQueue({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ClipboardCheckIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <Icon className="size-9 text-accent" />
        <h2 className="mt-4 text-xl font-semibold text-primary">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function Roster({ data }: { data: ReviewData }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const students = useMemo(
    () =>
      data.students.filter((student) => {
        const matchesQuery = [
          student.name,
          student.intendedMajor,
          student.applicationYear?.toString(),
        ]
          .join(" ")
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesFilter =
          filter === "all" ||
          (filter === "overdue" && student.overdueTasks > 0) ||
          (filter === "onboarding" && !student.onboardingCompleted);
        return matchesQuery && matchesFilter;
      }),
    [data.students, filter, query],
  );
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <CardTitle>Assigned students</CardTitle>
            <CardDescription>
              Only students with an active, explicit counselor assignment are
              visible.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <SearchIcon className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
              <Input
                className="w-64 pl-9"
                placeholder="Student, major, year"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44">
                <FilterIcon />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All students</SelectItem>
                <SelectItem value="overdue">Overdue work</SelectItem>
                <SelectItem value="onboarding">
                  Onboarding incomplete
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {students.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Application year</TableHead>
                <TableHead>Intended major</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.applicationYear ?? "Not set"}</TableCell>
                  <TableCell>{student.intendedMajor}</TableCell>
                  <TableCell>{student.projectCount}</TableCell>
                  <TableCell>
                    {student.overdueTasks ? (
                      <Badge variant="secondary">{student.overdueTasks}</Badge>
                    ) : (
                      <Badge variant="outline">0</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No assigned students match the current filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function CommentForm({
  projectId,
  taskId,
  evidenceId,
  reflectionId,
  onSaved,
}: {
  projectId: string;
  taskId?: string;
  evidenceId?: string;
  reflectionId?: string;
  onSaved: () => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [clarification, setClarification] = useState(false);
  const [busy, setBusy] = useState(false);
  async function send() {
    if (body.trim().length < 5)
      return toast.error("Write specific, factual guidance first.");
    setBusy(true);
    try {
      const response = await fetch("/api/counselor/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          taskId,
          evidenceId,
          reflectionId,
          body,
          clarificationRequested: clarification,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Comment could not be saved.");
      setBody("");
      setClarification(false);
      toast.success("Counselor feedback saved.");
      await onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Comment could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-4 border-t pt-4">
      <Field>
        <FieldLabel>Factual feedback</FieldLabel>
        <Textarea
          rows={3}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Name the record, explain what is clear or needs clarification, and avoid writing student work for them."
        />
      </Field>
      <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          checked={clarification}
          onChange={(event) => setClarification(event.target.checked)}
          type="checkbox"
        />
        Request clarification
      </label>
      <Button
        className="mt-3"
        size="sm"
        disabled={busy}
        onClick={() => void send()}
      >
        {busy ? (
          <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
        ) : (
          <MessageSquareTextIcon data-icon="inline-start" />
        )}
        Save feedback
      </Button>
    </div>
  );
}

function ProposalReview({
  data,
  refresh,
}: {
  data: ReviewData;
  refresh: () => Promise<void>;
}) {
  const proposals = data.projects.filter((project) =>
    ["awaiting_counselor_review", "revision_requested"].includes(
      project.status,
    ),
  );
  const [reason, setReason] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  async function decide(
    projectId: string,
    decision: "approved" | "revision_requested" | "rejected",
  ) {
    const explanation = reason[projectId] ?? "";
    if (explanation.trim().length < 10)
      return toast.error("Explain the factual reason for this decision.");
    setBusy(projectId);
    try {
      const response = await fetch("/api/counselor/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, decision, reason: explanation }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Review could not be saved.");
      toast.success(`Project ${humanize(decision)}.`);
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Review could not be saved.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <SectionHeader
        eyebrow="Proposal review"
        title="Review project direction"
        description="Approve feasibility and ethics; do not claim work is completed just because the plan is well-written."
      />
      {!proposals.length ? (
        <EmptyQueue
          icon={FileCheck2Icon}
          title="No project proposals await review"
          description="Submitted or revision-requested student projects will appear here when you have an active assignment."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {proposals.map((project) => {
            const student = data.students.find(
              (item) => item.id === project.student_id,
            );
            return (
              <Card key={project.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{project.title}</CardTitle>
                      <CardDescription>
                        {student?.name ?? "Assigned student"} · updated{" "}
                        {date(project.updated_at)}
                      </CardDescription>
                    </div>
                    <Badge variant={variant(project.status)}>
                      {humanize(project.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">Planned objective</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {project.main_objective ?? "No objective recorded."}
                  </p>
                  <Field className="mt-5">
                    <FieldLabel>Review explanation</FieldLabel>
                    <Textarea
                      rows={4}
                      value={reason[project.id] ?? ""}
                      onChange={(event) =>
                        setReason((current) => ({
                          ...current,
                          [project.id]: event.target.value,
                        }))
                      }
                      placeholder="Explain the factual reason for approval, revision, or rejection."
                    />
                  </Field>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-2">
                  <Button
                    disabled={busy === project.id}
                    onClick={() => void decide(project.id, "approved")}
                  >
                    {busy === project.id ? (
                      <LoaderCircleIcon
                        data-icon="inline-start"
                        className="animate-spin"
                      />
                    ) : (
                      <CheckCircle2Icon data-icon="inline-start" />
                    )}
                    Approve plan
                  </Button>
                  <Button
                    disabled={busy === project.id}
                    variant="outline"
                    onClick={() =>
                      void decide(project.id, "revision_requested")
                    }
                  >
                    Request revision
                  </Button>
                  <Button
                    disabled={busy === project.id}
                    variant="destructive"
                    onClick={() => void decide(project.id, "rejected")}
                  >
                    Reject
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function WorkReview({
  data,
  type,
  refresh,
}: {
  data: ReviewData;
  type: "tasks" | "evidence" | "reflections";
  refresh: () => Promise<void>;
}) {
  const title =
    type === "tasks"
      ? "Weekly progress"
      : type === "evidence"
        ? "Evidence review"
        : "Reflection review";
  const description =
    type === "tasks"
      ? "Review submitted work, obstacles, and task evidence without marking student claims as verified by default."
      : type === "evidence"
        ? "Accept, request clarification, reject, or flag privacy concerns with an audit-logged decision."
        : "Comment on concrete examples. Students retain authorship; there is no reflection score.";
  const records =
    type === "tasks"
      ? data.tasks.filter((task) => task.status === "submitted_for_review")
      : type === "evidence"
        ? data.evidence.filter(
            (item) =>
              item.review_status === "pending" ||
              item.review_status === "clarification_requested",
          )
        : data.reflections;
  const [busy, setBusy] = useState<string | null>(null);
  async function changeEvidence(id: string, reviewStatus: string) {
    setBusy(id);
    try {
      const response = await fetch(`/api/counselor/evidence/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reviewStatus }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Evidence decision could not be saved.");
      toast.success("Evidence review saved.");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Evidence decision could not be saved.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <SectionHeader
        eyebrow="Evidence-first review"
        title={title}
        description={description}
      />
      {!records.length ? (
        <EmptyQueue
          icon={
            type === "evidence"
              ? FileArchiveIcon
              : type === "reflections"
                ? MessageSquareTextIcon
                : ClipboardCheckIcon
          }
          title={`No ${type === "tasks" ? "submitted tasks" : type === "evidence" ? "evidence awaiting review" : "submitted reflections"}`}
          description="Records appear only from students assigned to your practice."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {records.map((record) => {
            const projectId =
              type === "tasks"
                ? (record as Task).project_id
                : type === "evidence"
                  ? (record as Evidence).project_id
                  : (record as Reflection).project_id;
            const project = data.projects.find((item) => item.id === projectId);
            const student = data.students.find(
              (item) => item.id === project?.student_id,
            );
            const heading =
              type === "tasks"
                ? (record as Task).title
                : type === "evidence"
                  ? (record as Evidence).title
                  : `${humanize((record as Reflection).reflection_type)} reflection`;
            const body =
              type === "tasks"
                ? [
                    (record as Task).student_reflection,
                    (record as Task).obstacle_notes,
                  ]
                    .filter(Boolean)
                    .join("\n\n")
                : type === "evidence"
                  ? (record as Evidence).student_explanation
                  : (record as Reflection).narrative;
            return (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{heading}</CardTitle>
                      <CardDescription>
                        {student?.name ?? "Assigned student"} ·{" "}
                        {project?.title ?? "Project"}
                      </CardDescription>
                    </div>
                    {type === "evidence" ? (
                      <Badge
                        variant={variant((record as Evidence).review_status)}
                      >
                        {humanize((record as Evidence).review_status)}
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {body || "No student statement was added to this record."}
                  </p>
                  {type === "evidence" ? (
                    <div className="mt-5">
                      <FieldLabel>Evidence decision</FieldLabel>
                      <Select
                        value={(record as Evidence).review_status}
                        onValueChange={(reviewStatus) =>
                          void changeEvidence(record.id, reviewStatus)
                        }
                        disabled={busy === record.id}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "pending",
                            "accepted",
                            "clarification_requested",
                            "rejected",
                            "privacy_concern",
                          ].map((status) => (
                            <SelectItem key={status} value={status}>
                              {humanize(status)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : null}
                  <CommentForm
                    projectId={projectId}
                    taskId={type === "tasks" ? record.id : undefined}
                    evidenceId={type === "evidence" ? record.id : undefined}
                    reflectionId={
                      type === "reflections" ? record.id : undefined
                    }
                    onSaved={refresh}
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function SkillsReview({
  data,
  refresh,
}: {
  data: ReviewData;
  refresh: () => Promise<void>;
}) {
  const rows = data.skills.filter(
    (row) =>
      row.status === "evidence_supported" ||
      row.status === "counselor_confirmed",
  );
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  async function setConfirmation(row: Skill, confirmed: boolean) {
    const rationale = notes[row.id] ?? "";
    if (rationale.trim().length < 10)
      return toast.error(
        "Add a factual rationale linked to accepted evidence.",
      );
    setBusy(row.id);
    try {
      const response = await fetch(`/api/counselor/skills/${row.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmed, rationale }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Skill decision could not be saved.");
      toast.success(
        confirmed ? "Skill confirmed." : "Skill confirmation removed.",
      );
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Skill decision could not be saved.",
      );
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <SectionHeader
        eyebrow="Skill confirmation"
        title="Confirm evidence-supported skills"
        description="A confirmation is a factual, source-linked observation—not a score or a flattering personality claim."
      />
      {!rows.length ? (
        <EmptyQueue
          icon={TargetIcon}
          title="No skills await confirmation"
          description="A skill appears here only after accepted evidence has been linked to it."
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {rows.map((row) => {
            const project = data.projects.find(
              (item) => item.id === row.project_id,
            );
            const student = data.students.find(
              (item) => item.id === project?.student_id,
            );
            return (
              <Card key={row.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>{skillName(row)}</CardTitle>
                      <CardDescription>
                        {student?.name ?? "Assigned student"} ·{" "}
                        {project?.title ?? "Project"}
                      </CardDescription>
                    </div>
                    <Badge variant={variant(row.status)}>
                      {humanize(row.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <Field>
                    <FieldLabel>Factual rationale</FieldLabel>
                    <Textarea
                      rows={4}
                      value={notes[row.id] ?? ""}
                      onChange={(event) =>
                        setNotes((current) => ({
                          ...current,
                          [row.id]: event.target.value,
                        }))
                      }
                      placeholder="Name the accepted evidence and the specific work it supports. Do not invent observations."
                    />
                  </Field>
                </CardContent>
                <CardFooter className="flex flex-wrap gap-3">
                  <Button
                    disabled={busy === row.id}
                    onClick={() => void setConfirmation(row, true)}
                  >
                    <ShieldCheckIcon data-icon="inline-start" />
                    Confirm skill
                  </Button>
                  {row.status === "counselor_confirmed" ? (
                    <Button
                      disabled={busy === row.id}
                      variant="outline"
                      onClick={() => void setConfirmation(row, false)}
                    >
                      Remove confirmation
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

function ProgressReports({ data }: { data: ReviewData }) {
  const [projectId, setProjectId] = useState(data.projects[0]?.id ?? "");
  const [output, setOutput] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  async function generate() {
    if (!projectId) return;
    setBusy(true);
    try {
      const response = await fetch("/api/generate/progress-summary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, locale: "en" }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Summary could not be generated.");
      setOutput(body.data);
      toast.success("Factual progress summary generated.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Summary could not be generated.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <SectionHeader
        eyebrow="Factual reporting"
        title="Progress reports"
        description="Generate a factual summary from eligible source records. It is not a recommendation letter."
      />
      {!data.projects.length ? (
        <EmptyQueue
          icon={SparklesIcon}
          title="No assigned project source records"
          description="A progress report becomes available when an assigned student has a project with eligible records."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Choose a project</CardTitle>
            <CardDescription>
              Only completed tasks, accepted evidence, submitted reflections,
              and confirmed skills are eligible.
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
              <pre className="mt-6 overflow-x-auto rounded-lg border bg-muted/30 p-5 whitespace-pre-wrap font-sans text-sm leading-6 text-muted-foreground">
                {JSON.stringify(output, null, 2)}
              </pre>
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
              Generate factual summary
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}

function Dashboard({ data }: { data: ReviewData }) {
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

export function CounselorLiveWorkspace({ section }: { section: string }) {
  const params = useParams<{ locale: string }>();
  const state = useReviewData();
  if (state.loading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-32" key={index} />
        ))}
      </div>
    );
  if (state.error || !state.data)
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>Review workspace unavailable</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>{state.error || "Review data could not be loaded."}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void state.refresh()}
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );
  const data = state.data;
  if (section === "dashboard") return <Dashboard data={data} />;
  if (section === "students")
    return (
      <>
        <SectionHeader
          eyebrow="Assigned roster"
          title="Students"
          description="Filter by student, intended major, application year, and overdue activity."
        />
        <Roster data={data} />
      </>
    );
  if (section === "proposals")
    return <ProposalReview data={data} refresh={state.refresh} />;
  if (section === "weekly-progress")
    return <WorkReview data={data} type="tasks" refresh={state.refresh} />;
  if (section === "evidence")
    return <WorkReview data={data} type="evidence" refresh={state.refresh} />;
  if (section === "reflections")
    return (
      <WorkReview data={data} type="reflections" refresh={state.refresh} />
    );
  if (section === "skills")
    return <SkillsReview data={data} refresh={state.refresh} />;
  if (section === "progress-reports") return <ProgressReports data={data} />;
  return (
    <>
      <SectionHeader
        eyebrow="Counselor Professional"
        title="Subscription"
        description="Your active capacity and billing are enforced on the server."
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Counselor Professional</CardTitle>
          <CardDescription>
            Up to 25 active students, factual reviews, skill confirmation,
            reports, and reusable templates.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-primary">
            {data.students.length}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              of 25 active students
            </span>
          </p>
        </CardContent>
      </Card>
      <div className="mt-6">
        <BillingCheckout audience="counselor" locale={params.locale ?? "en"} />
      </div>
    </>
  );
}
