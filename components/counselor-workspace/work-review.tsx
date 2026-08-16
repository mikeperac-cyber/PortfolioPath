"use client";

import { useState } from "react";
import {
  ClipboardCheckIcon,
  FileArchiveIcon,
  MessageSquareTextIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyQueue } from "./shared";
import { CommentForm } from "./shared";
import type { ReviewData } from "./types";
import { humanize, variant } from "./utils";

export function WorkReview({
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
        error instanceof Error ? error.message : "Evidence decision could not be saved.",
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
                ? (record as typeof data.tasks[0]).project_id
                : type === "evidence"
                  ? (record as typeof data.evidence[0]).project_id
                  : (record as typeof data.reflections[0]).project_id;
            const project = data.projects.find((item) => item.id === projectId);
            const student = data.students.find(
              (item) => item.id === project?.student_id,
            );
            const heading =
              type === "tasks"
                ? (record as typeof data.tasks[0]).title
                : type === "evidence"
                  ? (record as typeof data.evidence[0]).title
                  : `${humanize((record as typeof data.reflections[0]).reflection_type)} reflection`;
            const body =
              type === "tasks"
                ? [
                    (record as typeof data.tasks[0]).student_reflection,
                    (record as typeof data.tasks[0]).obstacle_notes,
                  ]
                    .filter(Boolean)
                    .join("\n\n")
                : type === "evidence"
                  ? (record as typeof data.evidence[0]).student_explanation
                  : (record as typeof data.reflections[0]).narrative;
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
                      <Badge variant={variant((record as typeof data.evidence[0]).review_status)}>
                        {humanize((record as typeof data.evidence[0]).review_status)}
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
                      <span className="text-sm font-medium">Evidence decision</span>
                      <Select
                        value={(record as typeof data.evidence[0]).review_status}
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
                    reflectionId={type === "reflections" ? record.id : undefined}
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