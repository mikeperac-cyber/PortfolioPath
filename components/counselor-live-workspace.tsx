"use client";

import { useParams } from "next/navigation";
import { SectionHeader } from "@/components/section-header";
import { useReviewData } from "./counselor-workspace/use-review-data";
import { Dashboard } from "./counselor-workspace/dashboard";
import { Roster } from "./counselor-workspace/roster";
import { ProposalReview } from "./counselor-workspace/proposal-review";
import { WorkReview } from "./counselor-workspace/work-review";
import { SkillsReview } from "./counselor-workspace/skills-review";
import { ProgressReports } from "./counselor-workspace/progress-reports";
import { BillingCheckout } from "@/components/billing-checkout";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CounselorLiveWorkspace({ section }: { section: string }) {
  const params = useParams<{ locale: string }>();
  const state = useReviewData();

  if (state.loading)
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton className="h-32" key={index} />
        ))}
      </div>
    );
  if (state.error || !state.data)
    return (
      <Alert variant="destructive">
        <AlertTriangleIcon />
        <AlertTitle>Review workspace unavailable</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>{state.error || "Review data could not be loaded."}</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void state.refresh()}
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );

  const data = state.data;

  const renderSection = () => {
    switch (section) {
      case "dashboard":
        return <Dashboard data={data} />;
      case "students":
        return (
          <>
            <SectionHeader
              eyebrow="Assigned roster"
              title="Students"
              description="Filter by student, intended major, application year, and overdue activity."
            />
            <Roster data={data} />
          </>
        );
      case "proposals":
        return <ProposalReview data={data} refresh={state.refresh} />;
      case "weekly-progress":
        return <WorkReview data={data} type="tasks" refresh={state.refresh} />;
      case "evidence":
        return <WorkReview data={data} type="evidence" refresh={state.refresh} />;
      case "reflections":
        return <WorkReview data={data} type="reflections" refresh={state.refresh} />;
      case "skills":
        return <SkillsReview data={data} refresh={state.refresh} />;
      case "progress-reports":
        return <ProgressReports data={data} />;
      default:
        return (
          <>
            <SectionHeader
              eyebrow="Counselor Professional"
              title="Subscription"
              description="Your active capacity and billing are enforced on the server."
            />
            <Card className="max-w-2xl">
              <CardHeader>
                <CardTitle>Counselor Professional</CardTitle>
                <CardDescription>
                  Up to 25 active students, factual reviews, skill confirmation,
                  reports, and reusable templates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-primary">
                  {data.students.length}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    of 25 active students
                  </span>
                </p>
              </CardContent>
            </Card>
            <div className="mt-6">
              <BillingCheckout audience="counselor" locale={params.locale ?? "en"} />
            </div>
          </>
        );
    }
  };

  return renderSection();
}