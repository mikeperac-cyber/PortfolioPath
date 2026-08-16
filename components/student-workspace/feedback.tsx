"use client";

import { MessageSquareTextIcon } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "./dashboard";
import type { WorkspaceData } from "./types";
import { formatDate } from "./utils";

interface FeedbackProps {
  data: WorkspaceData;
}

export function Feedback({ data }: FeedbackProps) {
  return (
    <>
      <SectionHeader
        eyebrow="Factual counselor review"
        title="Counselor feedback"
        description="Counselors can request clarification and confirm evidence. They cannot replace your source work or write your story for you."
      />
      {!data.comments.length ? (
        <EmptyState
          icon={MessageSquareTextIcon}
          title="No feedback yet"
          description="Comments appear after a counselor has access to your assigned project and reviews a proposal, task, evidence item, or reflection."
          action={<Badge variant="outline">No review activity</Badge>}
        />
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {data.comments.map((comment) => {
            const project = data.projects.find(
              (item) => item.id === comment.project_id,
            );
            return (
              <Card key={comment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>
                        {project?.title ?? "Project feedback"}
                      </CardTitle>
                      <CardDescription>
                        {formatDate(comment.created_at)}
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        comment.clarification_requested
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {comment.clarification_requested
                        ? "Clarification requested"
                        : "Comment"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {comment.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}