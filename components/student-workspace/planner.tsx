"use client";

import { memo, useState } from "react";
import Link from "next/link";
import { Clock3Icon } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "./dashboard";
import type { WorkspaceData, Task } from "./types";
import { formatDate, humanize, statusVariant } from "./utils";

interface PlannerProps {
  data: WorkspaceData;
  locale: string;
  refresh: () => Promise<void>;
}

export const TaskRow = memo(function TaskRow({
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
              Save
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
});

export function Planner({ data, locale, refresh }: PlannerProps) {
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
        description="Complete one real task at a time. 'Submitted for review' is different from counselor approval."
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