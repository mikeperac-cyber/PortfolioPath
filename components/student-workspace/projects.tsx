"use client";

import Link from "next/link";
import { useState } from "react";
import { LightbulbIcon, LoaderCircleIcon, PlusIcon, SendIcon } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/section-header";
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
import { EmptyState } from "./dashboard";
import type { WorkspaceData } from "./types";
import { formatDate, humanize, statusVariant } from "./utils";

interface ProjectsProps {
  data: WorkspaceData;
  locale: string;
  refresh: () => Promise<void>;
}

export function Projects({ data, locale, refresh }: ProjectsProps) {
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