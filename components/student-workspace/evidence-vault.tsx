"use client";

import Link from "next/link";
import { useState } from "react";
import {
  EyeIcon,
  FileArchiveIcon,
  LoaderCircleIcon,
  LockKeyholeIcon,
  UploadCloudIcon,
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
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "./dashboard";
import type { WorkspaceData, Evidence } from "./types";
import { formatDate, humanize, statusVariant } from "./utils";

interface EvidenceVaultProps {
  data: WorkspaceData;
  refresh: () => Promise<void>;
}

export function EvidenceVault({ data, refresh }: EvidenceVaultProps) {
  const initialProject = data.projects[0]?.id ?? "";
  const [projectId, setProjectId] = useState(initialProject);
  const [taskId, setTaskId] = useState("none");
  const [title, setTitle] = useState("");
  const [explanation, setExplanation] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [privacy, setPrivacy] = useState("private");
  const [busy, setBusy] = useState(false);

  const projectTasks = data.tasks.filter(
    (task) => task.project_id === projectId,
  );

  async function upload() {
    if (!projectId) return toast.error("Choose a project first.");
    if (!title.trim() || !explanation.trim())
      return toast.error(
        "Add a clear title and explain what the evidence supports.",
      );
    if (!file && !externalUrl.trim())
      return toast.error("Choose a file or add a valid external link.");
    setBusy(true);
    try {
      let storagePath: string | undefined;
      if (file) {
        const signed = await fetch("/api/evidence/sign-upload", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            projectId,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          }),
        });
        const signedBody = await signed.json();
        if (!signed.ok)
          throw new Error(
            signedBody.error ?? "Upload authorization could not be created.",
          );
        const stored = await fetch(signedBody.signedUrl, {
          method: "PUT",
          headers: { "content-type": file.type },
          body: file,
        });
        if (!stored.ok)
          throw new Error("The private file could not be uploaded.");
        storagePath = signedBody.path;
      }
      const type = file
        ? file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
            ? "video"
            : file.type === "application/pdf"
              ? "pdf"
              : file.type.includes("sheet") || file.type === "text/csv"
                ? "spreadsheet"
                : "document"
        : externalUrl.includes("github.com")
          ? "repository"
          : "website";
      const response = await fetch("/api/evidence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          taskId: taskId === "none" ? null : taskId,
          title,
          explanation,
          evidenceType: type,
          storagePath,
          externalUrl: externalUrl || undefined,
          mimeType: file?.type,
          sizeBytes: file?.size,
          privacy,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Evidence could not be saved.");
      toast.success("Private evidence saved with its provenance.");
      setTitle("");
      setExplanation("");
      setExternalUrl("");
      setFile(null);
      setTaskId("none");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Evidence could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function openEvidence(item: Evidence) {
    if (item.external_url)
      return window.open(item.external_url, "_blank", "noopener,noreferrer");
    if (!item.storage_path) return;
    try {
      const response = await fetch("/api/evidence/sign-download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ evidenceId: item.id }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "File could not be opened.",
      );
    }
  }

  return (
    <>
      <SectionHeader
        eyebrow="Private evidence vault"
        title="Show the work"
        description="Each item keeps its date, uploader, review state, privacy setting, and your explanation. It is private unless you select it for a portfolio."
      />
      {!data.projects.length ? (
        <EmptyState
          icon={FileArchiveIcon}
          title="Create a project before uploading"
          description="Evidence must always belong to a real project, not a sample or an unconnected folder."
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
              <CardTitle>Add one evidence item</CardTitle>
              <CardDescription>
                Upload original work or attach a responsible external link. A
                file cannot prove a claim without your explanation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel>Project</FieldLabel>
                  <Select
                    value={projectId}
                    onValueChange={(value) => {
                      setProjectId(value);
                      setTaskId("none");
                    }}
                  >
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
                  <FieldLabel>Related task (optional)</FieldLabel>
                  <Select value={taskId} onValueChange={setTaskId}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific task</SelectItem>
                      {projectTasks.map((task) => (
                        <SelectItem key={task.id} value={task.id}>
                          {task.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="evidence-file">
                    Private file (optional if using a link)
                  </FieldLabel>
                  <Input
                    id="evidence-file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,video/mp4,application/pdf,.docx,.xlsx,.csv"
                    onChange={(event) =>
                      setFile(event.target.files?.[0] ?? null)
                    }
                  />
                  <FieldDescription>
                    PNG, JPG, WebP, MP4, PDF, DOCX, XLSX, or CSV; maximum 25 MB.
                  </FieldDescription>
                </Field>
                <Field>
                  <FieldLabel htmlFor="evidence-link">
                    External link (optional)
                  </FieldLabel>
                  <Input
                    id="evidence-link"
                    type="url"
                    value={externalUrl}
                    onChange={(event) => setExternalUrl(event.target.value)}
                    placeholder="https://…"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="evidence-title">Title</FieldLabel>
                  <Input
                    id="evidence-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Week 2 observation notes"
                  />
                </Field>
                <Field>
                  <FieldLabel>Privacy</FieldLabel>
                  <Select value={privacy} onValueChange={setPrivacy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">
                        Private to me and my counselor
                      </SelectItem>
                      <SelectItem value="portfolio_selected">
                        Selected for my portfolio
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="evidence-explanation">
                    What does this item show?
                  </FieldLabel>
                  <Textarea
                    id="evidence-explanation"
                    rows={5}
                    value={explanation}
                    onChange={(event) => setExplanation(event.target.value)}
                    placeholder="State what you personally did, observed, created, or changed. Avoid claims the file cannot support."
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="justify-between gap-4 border-t">
              <p className="flex max-w-lg items-start gap-2 text-xs leading-5 text-muted-foreground">
                <LockKeyholeIcon className="mt-0.5 size-4 shrink-0" />
                Files are private by default and use short-lived upload/download
                access.
              </p>
              <Button disabled={busy} onClick={() => void upload()}>
                {busy ? (
                  <LoaderCircleIcon
                    data-icon="inline-start"
                    className="animate-spin"
                  />
                ) : (
                  <UploadCloudIcon data-icon="inline-start" />
                )}
                Save private evidence
              </Button>
            </CardFooter>
          </Card>
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Your evidence</CardTitle>
              <CardDescription>
                Accepted evidence can later support portfolio statements; it
                does not automatically prove impact.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {data.evidence.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Review</TableHead>
                      <TableHead>Privacy</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.evidence.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.title}</p>
                          <p className="mt-1 max-w-md text-xs text-muted-foreground">
                            {item.student_explanation}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(item.review_status)}>
                            {humanize(item.review_status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {humanize(item.privacy)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(item.uploaded_at)}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void openEvidence(item)}
                          >
                            <EyeIcon />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No evidence has been uploaded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}