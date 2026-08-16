"use client";

import Link from "next/link";
import { useState } from "react";
import {
  LoaderCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/section-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "./dashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkspaceData } from "./types";

interface GeneratedMaterialsProps {
  data: WorkspaceData;
  mode: "presentation" | "recommendation" | "application";
}

export function GeneratedMaterials({ data, mode }: GeneratedMaterialsProps) {
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