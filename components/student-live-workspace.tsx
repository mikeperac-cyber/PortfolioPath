"use client";

import { Suspense } from "react";
import { useWorkspace } from "./student-workspace/use-workspace";
import { LoadingWorkspace } from "./student-workspace/loading-workspace";
import { Dashboard } from "./student-workspace/dashboard";
import { Projects } from "./student-workspace/projects";
import { Planner } from "./student-workspace/planner";
import { EvidenceVault } from "./student-workspace/evidence-vault";
import { Reflections } from "./student-workspace/reflections";
import { Skills } from "./student-workspace/skills";
import { Feedback } from "./student-workspace/feedback";
import { PortfolioBuilder } from "./student-workspace/portfolio-builder";
import { GeneratedMaterials } from "./student-workspace/generated-materials";
import { FileArchiveIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function LiveStudentWorkspace({
  section,
  locale,
  studentName,
}: {
  section: string;
  locale: string;
  studentName: string;
}) {
  const workspace = useWorkspace();
  if (workspace.loading) return <LoadingWorkspace />;
  if (workspace.error || !workspace.data)
    return (
      <Alert variant="destructive">
        <FileArchiveIcon />
        <AlertTitle>Student workspace unavailable</AlertTitle>
        <AlertDescription className="flex flex-wrap items-center gap-3">
          <span>
            {workspace.error || "Your workspace could not be loaded."}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void workspace.refresh()}
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    );

  const data = workspace.data;

  const renderSection = () => {
    switch (section) {
      case "dashboard":
        return <Dashboard data={data} locale={locale} studentName={studentName} />;
      case "projects":
        return <Projects data={data} locale={locale} refresh={workspace.refresh} />;
      case "planner":
        return <Planner data={data} locale={locale} refresh={workspace.refresh} />;
      case "evidence":
        return <EvidenceVault data={data} refresh={workspace.refresh} />;
      case "reflections":
        return <Reflections data={data} refresh={workspace.refresh} />;
      case "skills":
        return <Skills data={data} />;
      case "feedback":
        return <Feedback data={data} />;
      case "portfolio":
        return <PortfolioBuilder data={data} refresh={workspace.refresh} />;
      case "presentation":
        return <GeneratedMaterials data={data} mode="presentation" />;
      case "recommendation-evidence":
        return <GeneratedMaterials data={data} mode="recommendation" />;
      case "application-prep":
        return <GeneratedMaterials data={data} mode="application" />;
      default:
        return null;
    }
  };

  return (
    <Suspense fallback={<LoadingWorkspace />}>
      {renderSection()}
    </Suspense>
  );
}