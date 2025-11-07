import type { Session } from "next-auth";

export function getSessionUserId(session: Session | null): string | null {
  if (!session?.user) return null;
  const user = session.user as Session["user"] & { id?: string | null };
  return user?.id ?? (user?.email ?? null);
}
