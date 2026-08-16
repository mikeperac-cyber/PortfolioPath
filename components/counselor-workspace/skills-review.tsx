"use client";

import { useState } from "react";
import { ShieldCheckIcon, TargetIcon } from "lucide-react";
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
import type { ReviewData, Skill } from "./types";
import { humanize, skillName, variant } from "./utils";

export function SkillsReview({
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
        error instanceof Error ? error.message : "Skill decision could not be saved.",
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