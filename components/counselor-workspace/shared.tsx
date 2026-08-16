import {
  ClipboardCheckIcon,
  LoaderCircleIcon,
  MessageSquareTextIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClipboardCheckIcon;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{value}</p>
        </div>
        <Icon className="size-5 text-secondary" />
      </CardContent>
    </Card>
  );
}

export function EmptyQueue({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof ClipboardCheckIcon;
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <Icon className="size-9 text-accent" />
        <h2 className="mt-4 text-xl font-semibold text-primary">{title}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export function CommentForm({
  projectId,
  taskId,
  evidenceId,
  reflectionId,
  onSaved,
}: {
  projectId: string;
  taskId?: string;
  evidenceId?: string;
  reflectionId?: string;
  onSaved: () => Promise<void>;
}) {
  const [body, setBody] = useState("");
  const [clarification, setClarification] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send() {
    if (body.trim().length < 5)
      return toast.error("Write specific, factual guidance first.");
    setBusy(true);
    try {
      const response = await fetch("/api/counselor/comments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          projectId,
          taskId,
          evidenceId,
          reflectionId,
          body,
          clarificationRequested: clarification,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error ?? "Comment could not be saved.");
      setBody("");
      setClarification(false);
      toast.success("Counselor feedback saved.");
      await onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Comment could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 border-t pt-4">
      <Field>
        <FieldLabel>Factual feedback</FieldLabel>
        <Textarea
          rows={3}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder="Name the record, explain what is clear or needs clarification, and avoid writing student work for them."
        />
      </Field>
      <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        <input
          checked={clarification}
          onChange={(event) => setClarification(event.target.checked)}
          type="checkbox"
        />
        Request clarification
      </label>
      <Button
        className="mt-3"
        size="sm"
        disabled={busy}
        onClick={() => void send()}
      >
        {busy ? (
          <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
        ) : (
          <MessageSquareTextIcon data-icon="inline-start" />
        )}
        Save feedback
      </Button>
    </div>
  );
}