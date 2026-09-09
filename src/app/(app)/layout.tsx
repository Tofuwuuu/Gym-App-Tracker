import { AppShell } from "@/components/layout/app-nav";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AppShell username={user.username} name={user.name}>
      {children}
    </AppShell>
  );
}
