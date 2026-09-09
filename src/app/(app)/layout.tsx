import { AppNav } from "@/components/layout/app-nav";
import { requireUser } from "@/lib/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AppNav username={user.username} name={user.name} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto w-full max-w-4xl p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
}
