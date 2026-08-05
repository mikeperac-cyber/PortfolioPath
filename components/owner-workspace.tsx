"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Building2Icon,
  CheckCircle2Icon,
  CircleDollarSignIcon,
  CrownIcon,
  FlagIcon,
  GraduationCapIcon,
  LoaderCircleIcon,
  ShieldCheckIcon,
  SparklesIcon,
  UsersIcon,
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Insights = {
  generatedAt: string;
  customers: {
    students: number;
    counselors: number;
    parents: number;
    mentors: number;
    schools: number;
  };
  activation: {
    onboardedStudents: number;
    studentsWithProjects: number;
    studentsWithEvidence: number;
    publishedPortfolios: number;
  };
  commercial: {
    recognizedRevenueTry: number;
    activePaidAccounts: number;
    complimentaryAccess: number;
    openSchoolQuotes: number;
  };
  quality: {
    awaitingCounselorReview: number;
    pendingMentorRequests: number;
    openEthicalFlags: number;
    evidenceAwaitingReview: number;
  };
};
type Customer = {
  id: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
};
type Organization = {
  id: string;
  name: string;
  slug: string;
  status: string;
  seat_limit: number;
  annual_contract_ends_at: string | null;
  created_at: string;
};
const tryCurrency = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  maximumFractionDigits: 0,
});

function Metric({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof UsersIcon;
  label: string;
  value: string | number;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between pt-6">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-primary">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        <Icon className="size-5 text-secondary" />
      </CardContent>
    </Card>
  );
}

function Overview() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    void fetch("/api/owner/dashboard", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok)
          throw new Error(body.error ?? "Owner insights could not be loaded.");
        setInsights(body);
      })
      .catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Owner insights could not be loaded.",
        ),
      );
  }, []);
  const registered = insights?.customers.students ?? 0;
  const activation =
    insights && registered
      ? Math.round((insights.activation.onboardedStudents / registered) * 100)
      : 0;
  if (error)
    return (
      <Alert variant="destructive">
        <FlagIcon />
        <AlertTitle>Owner insight unavailable</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!insights)
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton className="h-36" key={index} />
        ))}
      </div>
    );
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          icon={CircleDollarSignIcon}
          label="Recognized revenue"
          value={tryCurrency.format(insights.commercial.recognizedRevenueTry)}
          detail="Paid, recorded transactions only"
        />
        <Metric
          icon={UsersIcon}
          label="Active paid accounts"
          value={insights.commercial.activePaidAccounts}
          detail="Current paid entitlements"
        />
        <Metric
          icon={GraduationCapIcon}
          label="Students activated"
          value={`${activation}%`}
          detail={`${insights.activation.onboardedStudents} onboarding complete`}
        />
        <Metric
          icon={Building2Icon}
          label="School conversations"
          value={insights.commercial.openSchoolQuotes}
          detail="Open annual-plan quote requests"
        />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Customer activation</CardTitle>
            <CardDescription>
              Progress signals use counts only. They never inspect reflection,
              evidence, or counselor-comment content.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {[
              ["Onboarding complete", insights.activation.onboardedStudents],
              ["Created a project", insights.activation.studentsWithProjects],
              ["Added evidence", insights.activation.studentsWithEvidence],
              ["Portfolio published", insights.activation.publishedPortfolios],
            ].map(([label, value]) => {
              const percentage = registered
                ? Math.min(100, Math.round((Number(value) / registered) * 100))
                : 0;
              return (
                <div className="flex flex-col gap-2" key={String(label)}>
                  <div className="flex justify-between text-sm">
                    <span>{label}</span>
                    <span className="text-muted-foreground">
                      {value} · {percentage}%
                    </span>
                  </div>
                  <Progress value={percentage} />
                </div>
              );
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quality queue</CardTitle>
            <CardDescription>Work needing a human decision.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {[
              [
                "Projects awaiting review",
                insights.quality.awaitingCounselorReview,
              ],
              [
                "Evidence awaiting review",
                insights.quality.evidenceAwaitingReview,
              ],
              [
                "Mentor requests pending",
                insights.quality.pendingMentorRequests,
              ],
              ["Ethical flags open", insights.quality.openEthicalFlags],
            ].map(([label, value]) => (
              <div
                className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                key={String(label)}
              >
                <span className="text-sm">{label}</span>
                <Badge variant={Number(value) ? "secondary" : "outline"}>
                  {value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Family network</CardTitle>
            <CardDescription>Consent-linked visibility only.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">
              {insights.customers.parents}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Active parent links
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Mentor network</CardTitle>
            <CardDescription>
              Specific, factual verification requests.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">
              {insights.customers.mentors}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Active mentor links
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Internal access</CardTitle>
            <CardDescription>
              Owner-granted access is distinct from checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold text-primary">
              {insights.commercial.complimentaryAccess}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Active complimentary grants
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selected, setSelected] = useState("");
  const [planCode, setPlanCode] = useState("complete");
  const [durationDays, setDurationDays] = useState("365");
  const [grantKind, setGrantKind] = useState("complimentary");
  const [discountPercent, setDiscountPercent] = useState("25");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    void fetch("/api/owner/customers")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setCustomers(body.customers ?? []);
      })
      .catch(() => toast.error("Customers could not be loaded."));
  }, []);
  async function grant() {
    if (!selected) return toast.error("Choose a customer first.");
    setBusy(true);
    try {
      const response = await fetch("/api/owner/grants", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: selected,
          planCode,
          grantKind,
          durationDays: Number(durationDays),
          ...(grantKind === "discount"
            ? { discountPercent: Number(discountPercent) }
            : {}),
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      toast.success("Access grant saved and audit-logged.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "The grant could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
          <CardDescription>
            Use an owner grant only when you intentionally want to provide
            internal, scholarship, or pilot access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {customers.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Primary role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">
                      {customer.full_name || "Unnamed account"}
                    </TableCell>
                    <TableCell className="capitalize">
                      {customer.role}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          customer.status === "active" ? "secondary" : "outline"
                        }
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(customer.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Customer accounts will appear here after registration.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Grant access</CardTitle>
          <CardDescription>
            Checkout is never required for an owner-issued grant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel>Customer</FieldLabel>
              <Select value={selected} onValueChange={setSelected}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.full_name || customer.id.slice(0, 8)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Plan</FieldLabel>
              <Select value={planCode} onValueChange={setPlanCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="blueprint">Project Blueprint</SelectItem>
                    <SelectItem value="complete">Complete Portfolio</SelectItem>
                    <SelectItem value="counselor">
                      Counselor Professional
                    </SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Access type</FieldLabel>
              <Select value={grantKind} onValueChange={setGrantKind}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="complimentary">Complimentary</SelectItem>
                    <SelectItem value="manual">Manual access</SelectItem>
                    <SelectItem value="discount">Discount record</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            {grantKind === "discount" ? (
              <Field>
                <FieldLabel htmlFor="grant-discount">
                  Discount percentage
                </FieldLabel>
                <Input
                  id="grant-discount"
                  type="number"
                  min={1}
                  max={99}
                  value={discountPercent}
                  onChange={(event) => setDiscountPercent(event.target.value)}
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="grant-duration">Days active</FieldLabel>
              <Input
                id="grant-duration"
                type="number"
                min={1}
                max={3650}
                value={durationDays}
                onChange={(event) => setDurationDays(event.target.value)}
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button disabled={busy} onClick={() => void grant()}>
            {busy ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <CrownIcon data-icon="inline-start" />
            )}
            Grant access
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () =>
    void fetch("/api/owner/organizations")
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error);
        setOrganizations(body.organizations ?? []);
      })
      .catch(() => toast.error("School organizations could not be loaded."));
  useEffect(load, []);
  const normalizedSlug = useMemo(
    () =>
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, ""),
    [name, slug],
  );
  async function create() {
    setBusy(true);
    try {
      const response = await fetch("/api/owner/organizations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, slug: normalizedSlug }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setName("");
      setSlug("");
      load();
      toast.success("School organization created as a quote-led prospect.");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "School organization could not be created.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
      <Card>
        <CardHeader>
          <CardTitle>School partnerships</CardTitle>
          <CardDescription>
            Schools remain quote-led annual accounts. Seats, cohorts, and staff
            are set after qualification.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Seats</TableHead>
                  <TableHead>Contract</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((organization) => (
                  <TableRow key={organization.id}>
                    <TableCell className="font-medium">
                      {organization.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          organization.status === "active"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {organization.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{organization.seat_limit}</TableCell>
                    <TableCell>
                      {organization.annual_contract_ends_at
                        ? new Date(
                            organization.annual_contract_ends_at,
                          ).toLocaleDateString()
                        : "Quote in progress"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">
              Create a school only after an initial qualified conversation.
            </p>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Start a school record</CardTitle>
          <CardDescription>
            This creates the private organization record; it does not activate
            billing or send messages.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="school-name">
                School or organization
              </FieldLabel>
              <Input
                id="school-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="school-slug">Workspace URL name</FieldLabel>
              <Input
                id="school-slug"
                value={slug}
                placeholder={normalizedSlug || "example-school"}
                onChange={(event) => setSlug(event.target.value.toLowerCase())}
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter>
          <Button
            disabled={
              busy || name.trim().length < 2 || normalizedSlug.length < 2
            }
            onClick={() => void create()}
          >
            {busy ? (
              <LoaderCircleIcon
                data-icon="inline-start"
                className="animate-spin"
              />
            ) : (
              <Building2Icon data-icon="inline-start" />
            )}
            Create prospect
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

function Safety() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
      <Card>
        <CardHeader>
          <CardTitle>Owner safety standard</CardTitle>
          <CardDescription>
            Commercial growth is never a reason to weaken student ownership or
            privacy.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {[
            "Only evidence-supported work can be presented as complete.",
            "Parents see only consented progress and selected evidence.",
            "Mentors receive a specific request, never a pre-written recommendation.",
            "Owner insight measures events and counts—not reflection or evidence contents.",
            "Every access grant, verification, and sensitive platform action is audit-logged.",
          ].map((item) => (
            <p className="flex gap-3 text-sm leading-6" key={item}>
              <ShieldCheckIcon className="mt-0.5 size-4 shrink-0 text-success" />
              {item}
            </p>
          ))}
        </CardContent>
      </Card>
      <Alert>
        <ShieldCheckIcon />
        <AlertTitle>Human review remains visible</AlertTitle>
        <AlertDescription>
          Templates guide students, but do not invent activities, impact,
          emotions, counselor observations, partnerships, certificates,
          recommendations, admissions outcomes, or scholarship results.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function Sandbox() {
  const [title, setTitle] = useState("");
  const [objective, setObjective] = useState("");
  const [saved, setSaved] = useState(false);
  function save() {
    window.localStorage.setItem(
      "pp-owner-sandbox",
      JSON.stringify({ title, objective }),
    );
    setSaved(true);
    toast.success("Sandbox draft saved only in this browser.");
  }
  return (
    <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <Card className="border-accent">
        <CardHeader>
          <Badge className="w-fit">Isolated test mode</Badge>
          <CardTitle className="mt-3">Student Sandbox</CardTitle>
          <CardDescription>
            Try onboarding language and project framing without creating a real
            student, project, evidence item, or billing record.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-6 text-muted-foreground">
            Sandbox content stays in this browser until you clear it. It cannot
            be submitted, reviewed, exported, shared, or mistaken for genuine
            student work.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Test a project framing</CardTitle>
          <CardDescription>
            Use fictional placeholder wording only to inspect flow and clarity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="sandbox-title">Draft title</FieldLabel>
              <Input
                id="sandbox-title"
                value={title}
                onChange={(event) => {
                  setSaved(false);
                  setTitle(event.target.value);
                }}
                placeholder="Example test project"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="sandbox-objective">
                Draft objective
              </FieldLabel>
              <Input
                id="sandbox-objective"
                value={objective}
                onChange={(event) => {
                  setSaved(false);
                  setObjective(event.target.value);
                }}
                placeholder="Test how a planned objective appears"
              />
            </Field>
          </FieldGroup>
        </CardContent>
        <CardFooter className="gap-3">
          <Button onClick={save}>
            <SparklesIcon data-icon="inline-start" />
            Save sandbox draft
          </Button>
          {saved ? (
            <span className="flex items-center gap-2 text-xs text-success">
              <CheckCircle2Icon className="size-4" />
              Local only
            </span>
          ) : null}
        </CardFooter>
      </Card>
    </div>
  );
}

export function OwnerWorkspace({ section }: { section: string }) {
  const content =
    section === "customers" ? (
      <Customers />
    ) : section === "organizations" ? (
      <Organizations />
    ) : section === "safety" ? (
      <Safety />
    ) : section === "sandbox" ? (
      <Sandbox />
    ) : (
      <Overview />
    );
  const copy: Record<string, [string, string, string]> = {
    dashboard: [
      "Platform owner",
      "A calm view of the business and its safeguards.",
      "Owner console",
    ],
    customers: [
      "Commercial control",
      "Grant internal access intentionally, without routing your own work through checkout.",
      "Customers & grants",
    ],
    organizations: [
      "School partnerships",
      "Create annual, quote-led school workspaces after qualification.",
      "Schools",
    ],
    safety: [
      "Ethics & privacy",
      "Keep trust and student ownership visible as the platform grows.",
      "Safety standard",
    ],
    sandbox: [
      "Safe testing",
      "Explore the student framing without touching real data.",
      "Student Sandbox",
    ],
  };
  const [eyebrow, description, title] = copy[section] ?? copy.dashboard;
  return (
    <>
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
      />
      {content}
    </>
  );
}
