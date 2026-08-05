import { RelationshipInviteAccept } from "@/components/relationship-invite-accept"

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-muted/30 px-4 py-12"><RelationshipInviteAccept token={token} /></main>
}
