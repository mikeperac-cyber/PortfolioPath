"use client";

import { useState } from "react";
import {
  CheckCircle2Icon,
  FileCheck2Icon,
  LoaderCircleIcon,
} from "lucide-react";
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
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { EmptyQueue } from "./shared";
import type { ReviewData } from "./types";
import { date, humanize, variant } from "./utils";

export function ProposalReview({
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