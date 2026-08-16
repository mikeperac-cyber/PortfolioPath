"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  FileTextIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  SaveIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/section-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "./dashboard";
import type { WorkspaceData, Portfolio, PortfolioSection } from "./types";
import { contentText, humanize } from "./utils";

interface PortfolioBuilderProps {
  data: WorkspaceData;
  refresh: () => Promise<void>;
}

export function PortfolioBuilder({ data, refresh }: PortfolioBuilderProps) {
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
                Only accepted evidence marked &ldquo;selected for my portfolio&rdquo; can
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
              description="Create an editable draft from the project's approved description, completed tasks, selected accepted evidence, reflections, outcomes, and confirmed skills."
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