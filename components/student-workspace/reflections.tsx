"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  LoaderCircleIcon,
  NotebookPenIcon,
  SaveIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/section-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { EmptyState } from "./dashboard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { WorkspaceData } from "./types";

interface ReflectionsProps {
  data: WorkspaceData;
  refresh: () => Promise<void>;
}

export function Reflections({ data, refresh }: ReflectionsProps) {
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