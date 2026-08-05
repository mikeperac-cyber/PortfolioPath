"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  BarChart3Icon,
  BellIcon,
  BookOpenCheckIcon,
  BriefcaseBusinessIcon,
  ClipboardCheckIcon,
  CreditCardIcon,
  FileArchiveIcon,
  FileCheck2Icon,
  FileTextIcon,
  FlagIcon,
  FolderKanbanIcon,
  FolderOpenIcon,
  GraduationCapIcon,
  HeartHandshakeIcon,
  LayoutDashboardIcon,
  LightbulbIcon,
  LogOutIcon,
  MessageSquareTextIcon,
  NotebookPenIcon,
  PresentationIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TargetIcon,
  UserRoundIcon,
  UsersIcon,
  Building2Icon,
  UserCheckIcon,
  ShieldIcon,
} from "lucide-react";
import {
  workspacePath,
  type CurrentUser,
  type WorkspaceRole,
} from "@/lib/auth-roles";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

type NavigationItem = readonly [string, string, typeof LayoutDashboardIcon];

const nav: Record<WorkspaceRole, readonly NavigationItem[]> = {
  student: [
    ["dashboard", "Overview", LayoutDashboardIcon],
    ["onboarding", "Profile & onboarding", UserRoundIcon],
    ["project-ideas", "Project ideas", LightbulbIcon],
    ["projects", "My projects", FolderKanbanIcon],
    ["planner", "Weekly planner", ClipboardCheckIcon],
    ["evidence", "Evidence vault", FileArchiveIcon],
    ["reflections", "Reflection journal", NotebookPenIcon],
    ["skills", "Skills tracker", TargetIcon],
    ["feedback", "Counselor feedback", MessageSquareTextIcon],
    ["portfolio", "Portfolio builder", BriefcaseBusinessIcon],
    ["presentation", "Presentation builder", PresentationIcon],
    ["application-prep", "Application prep", GraduationCapIcon],
    ["recommendation-evidence", "Recommendation evidence", FileCheck2Icon],
    ["subscription", "Subscription", CreditCardIcon],
  ],
  counselor: [
    ["dashboard", "Overview", LayoutDashboardIcon],
    ["students", "Assigned students", UsersIcon],
    ["proposals", "Project proposals", FolderOpenIcon],
    ["weekly-progress", "Weekly progress", ClipboardCheckIcon],
    ["evidence", "Evidence review", FileArchiveIcon],
    ["reflections", "Reflection review", NotebookPenIcon],
    ["skills", "Skills confirmation", TargetIcon],
    ["progress-reports", "Progress reports", FileTextIcon],
    ["subscription", "Subscription", CreditCardIcon],
  ],
  administrator: [
    ["dashboard", "Overview", BarChart3Icon],
    ["users", "Users", UsersIcon],
    ["assignments", "Assignments", GraduationCapIcon],
    ["categories", "Categories", FolderOpenIcon],
    ["templates", "Project templates", BookOpenCheckIcon],
    ["plans", "Plans", CreditCardIcon],
    ["flags", "Flagged content", FlagIcon],
    ["settings", "Platform settings", SettingsIcon],
  ],
  owner: [
    ["dashboard", "Owner console", BarChart3Icon],
    ["customers", "Customers & grants", UsersIcon],
    ["organizations", "Schools", Building2Icon],
    ["safety", "Ethics & safety", ShieldIcon],
    ["sandbox", "Student sandbox", SparklesIcon],
  ],
  parent: [["dashboard", "My student", HeartHandshakeIcon]],
  mentor: [["dashboard", "Verification inbox", UserCheckIcon]],
  school: [
    ["dashboard", "School overview", Building2Icon],
    ["students", "Students & cohorts", UsersIcon],
    ["templates", "Template library", BookOpenCheckIcon],
    ["subscription", "Annual plan", CreditCardIcon],
  ],
};

const workspaceLabel: Record<WorkspaceRole, string> = {
  student: "Student workspace",
  counselor: "Counselor practice",
  administrator: "Administration",
  owner: "Owner console",
  parent: "Family view",
  mentor: "Mentor verification",
  school: "School workspace",
};

function OwnerRoleSwitcher({ locale }: { locale: string }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden gap-2 md:flex">
          <ShieldCheckIcon data-icon="inline-start" />
          Owner mode
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={workspacePath(locale, "owner")}>Owner Console</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={workspacePath(locale, "counselor")}>
              Counselor Practice
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/${locale}/owner/sandbox`}>Student Sandbox</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AppShell({
  user,
  children,
  workspace,
}: {
  user: CurrentUser;
  children: React.ReactNode;
  workspace?: WorkspaceRole;
}) {
  const params = useParams<{ locale: string }>();
  const locale = params.locale ?? "en";
  const pathname = usePathname();
  const router = useRouter();
  const activeWorkspace =
    workspace ?? (user.role === "administrator" ? "administrator" : user.role);
  const rolePath =
    activeWorkspace === "administrator" ? "admin" : activeWorkspace;
  async function logout() {
    await createClient().auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-16 justify-center border-b px-4">
          <Link
            href={`/${locale}/${rolePath}/dashboard`}
            className="font-heading text-lg font-semibold tracking-tight text-sidebar-foreground"
          >
            Portfolio<span className="text-accent">Path</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>
              {workspaceLabel[activeWorkspace]}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {nav[activeWorkspace].map(([slug, label, Icon]) => {
                  const href = `/${locale}/${rolePath}/${slug}`;
                  return (
                    <SidebarMenuItem key={slug}>
                      <SidebarMenuButton
                        asChild
                        isActive={pathname === href}
                        tooltip={label}
                      >
                        <Link href={href}>
                          <Icon />
                          <span>{label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href={`/${locale}/ethical-use`}>
                  <ShieldCheckIcon />
                  <span>Ethical use</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-card/95 px-4 backdrop-blur md:px-7">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            {user.roles.includes("platform_owner") ? (
              <OwnerRoleSwitcher locale={locale} />
            ) : null}
            <span className="hidden text-sm text-muted-foreground lg:inline">
              Authentic work. Documented clearly.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <BellIcon />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-2 px-2">
                  <Avatar className="size-8">
                    <AvatarFallback>
                      {user.full_name
                        .split(" ")
                        .map((value) => value[0])
                        .slice(0, 2)
                        .join("") || "PP"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-40 truncate text-sm sm:block">
                    {user.full_name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  {workspaceLabel[activeWorkspace]}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={logout}>
                  <LogOutIcon />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main id="main" className="min-h-[calc(100vh-4rem)] p-4 md:p-7 lg:p-9">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
