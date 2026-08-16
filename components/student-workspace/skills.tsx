"use client";

import Link from "next/link";
import { TargetIcon } from "lucide-react";
import { SectionHeader } from "@/components/section-header";
import { EmptyState } from "./dashboard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkspaceData } from "./types";
import { humanize, skillName, statusVariant } from "./utils";

interface SkillsProps {
  data: WorkspaceData;
}

export function Skills({ data }: SkillsProps) {
  return (
    <>
      <SectionHeader
        eyebrow="Evidence-linked"
        title="Skills tracker"
        description="Only three states are used: target, evidence-supported, and counselor-confirmed. There are no AI percentages."
      />
      {!data.skills.length ? (
        <EmptyState
          icon={TargetIcon}
          title="No target skills recorded yet"
          description="Add target skills while creating or revising a project. A skill moves only when evidence and then counselor confirmation support it."
          action={
            <Button asChild>
              <Link href="/en/student/projects">Review projects</Link>
            </Button>
          }
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Skill</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Connected evidence</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.skills.map((row) => {
                  const project = data.projects.find(
                    (item) => item.id === row.project_id,
                  );
                  const skill = Array.isArray(row.skills)
                    ? row.skills[0]
                    : row.skills;
                  const linked = skill?.id
                    ? data.evidence.filter((item) => item.skill_id === skill.id)
                        .length
                    : 0;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {skillName(row)}
                      </TableCell>
                      <TableCell>{project?.title ?? "Project"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)}>
                          {humanize(row.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {linked
                          ? `${linked} item${linked === 1 ? "" : "s"}`
                          : "No linked evidence yet"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}