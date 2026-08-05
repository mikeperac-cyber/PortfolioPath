"use client";

import { useEffect, useState } from "react";
import {
  Building2Icon,
  CheckCircle2Icon,
  Clock3Icon,
  HeartHandshakeIcon,
  LoaderCircleIcon,
  MessageSquareTextIcon,
  ShieldCheckIcon,
  UserCheckIcon,
} from "lucide-react";
import { toast } from "sonner";
import { SectionHeader } from "@/components/section-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

type ParentStudent = {
  id: string;
  name: string;
  permissions: Record<string, boolean>;
  projects: Array<{
    id: string;
    title: string;
    status: string;
    endDate: string | null;
  }>;
  updates: Array<{
    id: string;
    title: string;
    body: string;
    created_at: string;
  }>;
};
type MentorRequest = {
  id: string;
  projectTitle: string;
  studentName: string;
  student_statement: string;
  requested_claim: string;
  status: string;
  mentor_response: string | null;
  created_at: string;
};
type School = {
  id: string;
  name: string;
  status: string;
  seat_limit: number;
  annual_contract_ends_at: string | null;
  membershipRole: string;
  cohorts: Array<{
    id: string;
    name: string;
    graduation_year: number | null;
    studentCount: number;
  }>;
};

function LoadingCards() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {[0, 1].map((index) => (
        <Skeleton className="h-52" key={index} />
      ))}
    </div>
  );
}

export function ParentWorkspace() {
  const [students, setStudents] = useState<ParentStudent[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void fetch("/api/parent/dashboard")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setStudents(body.students ?? []);
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Family access could not be loaded.",
        ),
      );
  }, []);
  return (
    <>
      <SectionHeader
        eyebrow="Family view"
        title="See the path, not private journal entries."
        description="This consent-based view shows milestones, project progress, selected evidence, and counselor updates. Student reflections remain private."
      />
      {error ? (
        <Alert variant="destructive">
          <HeartHandshakeIcon />
          <AlertTitle>Family view unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : students === null ? (
        <LoadingCards />
      ) : students.length === 0 ? (
        <Alert>
          <HeartHandshakeIcon />
          <AlertTitle>No student connection yet</AlertTitle>
          <AlertDescription>
            Ask your student to create a private parent invitation from their
            workspace, then accept it using this account.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {students.map((student) => (
            <Card key={student.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{student.name}</CardTitle>
                    <CardDescription>
                      Consent-based project progress
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Private family view</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <div>
                  <p className="mb-3 text-sm font-medium">Projects</p>
                  {student.projects.length ? (
                    <div className="flex flex-col gap-3">
                      {student.projects.map((project) => (
                        <div className="rounded-lg border p-4" key={project.id}>
                          <div className="flex items-start justify-between gap-3">
                            <p className="font-medium">{project.title}</p>
                            <Badge variant="outline">
                              {project.status.replaceAll("_", " ")}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {project.endDate
                              ? `Planned end: ${new Date(project.endDate).toLocaleDateString()}`
                              : "No planned end date"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No active project is shared yet.
                    </p>
                  )}
                </div>
                <div>
                  <p className="mb-3 text-sm font-medium">Counselor updates</p>
                  {student.updates.length ? (
                    <div className="flex flex-col gap-3">
                      {student.updates.map((update) => (
                        <div
                          className="border-l-2 border-accent pl-4"
                          key={update.id}
                        >
                          <p className="font-medium">{update.title}</p>
                          <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            {update.body}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {new Date(update.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Counselor updates will appear here when shared with the
                      family.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function MentorResponse({
  requestRow,
  onSaved,
}: {
  requestRow: MentorRequest;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState("confirmed");
  const [response, setResponse] = useState(requestRow.mentor_response ?? "");
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (response.trim().length < 10)
      return toast.error(
        "Please provide a factual response of at least 10 characters.",
      );
    setBusy(true);
    try {
      const result = await fetch("/api/mentor/respond", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestId: requestRow.id, status, response }),
      });
      const body = await result.json();
      if (!result.ok) throw new Error(body.error);
      toast.success("Verification response saved.");
      onSaved();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Response could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (requestRow.status !== "pending")
    return (
      <Badge
        variant={requestRow.status === "confirmed" ? "secondary" : "outline"}
      >
        {requestRow.status.replaceAll("_", " ")}
      </Badge>
    );
  return (
    <div className="mt-5 border-t pt-5">
      <FieldGroup>
        <Field>
          <FieldLabel>Factual response</FieldLabel>
          <Textarea
            rows={4}
            value={response}
            onChange={(event) => setResponse(event.target.value)}
            placeholder="State only what you can personally confirm or clarify."
          />
        </Field>
        <Field>
          <FieldLabel>Decision</FieldLabel>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="confirmed">
                  Confirm factual statement
                </SelectItem>
                <SelectItem value="clarification_requested">
                  Request clarification
                </SelectItem>
                <SelectItem value="declined">Decline to confirm</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
      </FieldGroup>
      <Button className="mt-4" disabled={busy} onClick={() => void submit()}>
        {busy ? (
          <LoaderCircleIcon data-icon="inline-start" className="animate-spin" />
        ) : (
          <CheckCircle2Icon data-icon="inline-start" />
        )}
        Save response
      </Button>
    </div>
  );
}

export function MentorWorkspace() {
  const [requests, setRequests] = useState<MentorRequest[] | null>(null);
  const [error, setError] = useState("");
  const load = () =>
    void fetch("/api/mentor/dashboard")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setRequests(body.requests ?? []);
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Verification requests could not be loaded.",
        ),
      );
  useEffect(load, []);
  return (
    <>
      <SectionHeader
        eyebrow="Mentor verification"
        title="Confirm facts, not a student persona."
        description="Review the student’s exact request and respond only to details you can personally confirm. This is not a recommendation letter workspace."
      />
      {error ? (
        <Alert variant="destructive">
          <UserCheckIcon />
          <AlertTitle>Verification inbox unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : requests === null ? (
        <LoadingCards />
      ) : requests.length === 0 ? (
        <Alert>
          <UserCheckIcon />
          <AlertTitle>No verification requests yet</AlertTitle>
          <AlertDescription>
            Students who invite you can later ask about a specific task,
            evidence item, or skill. You will never be asked to invent an
            observation.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {requests.map((requestRow) => (
            <Card key={requestRow.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>{requestRow.projectTitle}</CardTitle>
                    <CardDescription>
                      {requestRow.studentName} · requested{" "}
                      {new Date(requestRow.created_at).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      requestRow.status === "pending" ? "outline" : "secondary"
                    }
                  >
                    {requestRow.status.replaceAll("_", " ")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">Student statement</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {requestRow.student_statement}
                </p>
                <p className="mt-5 text-sm font-medium">
                  What the student asks you to confirm
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {requestRow.requested_claim}
                </p>
                <MentorResponse requestRow={requestRow} onSaved={load} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export function SchoolWorkspace({ section }: { section: string }) {
  const [schools, setSchools] = useState<School[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void fetch("/api/school/dashboard")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setSchools(body.organizations ?? []);
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "School workspace could not be loaded.",
        ),
      );
  }, []);
  const title =
    section === "students"
      ? "Students & cohorts"
      : section === "templates"
        ? "Template library"
        : section === "subscription"
          ? "Annual plan"
          : "School overview";
  const description =
    section === "students"
      ? "Cohort visibility is limited to the school organization and does not expose private reflections."
      : section === "templates"
        ? "Reuse ethical, bilingual project templates across your own school workspace."
        : section === "subscription"
          ? "School access is annual and quote-led; no self-serve enterprise checkout is used."
          : "A focused operational view for the students and counselors your school has enrolled.";
  return (
    <>
      <SectionHeader
        eyebrow="School partnership"
        title={title}
        description={description}
      />
      {error ? (
        <Alert variant="destructive">
          <Building2Icon />
          <AlertTitle>School workspace unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : schools === null ? (
        <LoadingCards />
      ) : schools.length === 0 ? (
        <Alert>
          <Building2Icon />
          <AlertTitle>No school workspace assigned</AlertTitle>
          <AlertDescription>
            Your Platform Owner creates your organization, staff membership,
            cohorts, and annual plan after a school partnership is approved.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          {schools.map((school) => (
            <Card key={school.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{school.name}</CardTitle>
                    <CardDescription>
                      {school.membershipRole} access · {school.seat_limit} seats
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      school.status === "active" ? "secondary" : "outline"
                    }
                  >
                    {school.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {section === "students" ? (
                  <div className="flex flex-col gap-3">
                    {school.cohorts.length ? (
                      school.cohorts.map((cohort) => (
                        <div
                          className="flex items-center justify-between rounded-lg border p-4"
                          key={cohort.id}
                        >
                          <div>
                            <p className="font-medium">{cohort.name}</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {cohort.graduation_year
                                ? `Class of ${cohort.graduation_year}`
                                : "Graduation year not set"}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {cohort.studentCount} students
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Cohorts will appear after school staff enroll students.
                      </p>
                    )}
                  </div>
                ) : section === "templates" ? (
                  <Alert>
                    <ShieldCheckIcon />
                    <AlertTitle>Template access is ready</AlertTitle>
                    <AlertDescription>
                      School templates will use the same factual safeguards as
                      individual student templates. The owner can activate a
                      private school template library after onboarding.
                    </AlertDescription>
                  </Alert>
                ) : section === "subscription" ? (
                  <div>
                    <p className="text-2xl font-semibold text-primary">
                      Annual school partnership
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {school.annual_contract_ends_at
                        ? `Current access ends ${new Date(school.annual_contract_ends_at).toLocaleDateString()}.`
                        : "Contract details are managed through your platform owner."}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <Clock3Icon className="size-5 text-secondary" />
                      <p className="text-sm">
                        {school.cohorts.length} active cohort
                        {school.cohorts.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <MessageSquareTextIcon className="size-5 text-secondary" />
                      <p className="text-sm">
                        Counselor review remains evidence-first and
                        student-owned.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
