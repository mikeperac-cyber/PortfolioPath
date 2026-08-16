"use client";

import { useState } from "react";
import { LoaderCircleIcon, SparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/section-header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyQueue } from "./shared";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ReviewData } from "./types";

export function ProgressReports({ data }: { data: ReviewData }) {
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
        error instanceof Error ? error.message : "Summary could not be generated.",
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