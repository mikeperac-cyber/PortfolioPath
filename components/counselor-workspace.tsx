"use client";

import { CounselorLiveWorkspace } from "@/components/counselor-live-workspace";

/**
 * Compatibility entry point for the original routed workspace. The former
 * prototype-only dashboard has been removed so counselor pages always render
 * live, assigned-student data.
 */
export function CounselorWorkspace({ section }: { section: string }) {
  return <CounselorLiveWorkspace section={section} />;
}
