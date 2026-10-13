import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { safeNextPath } from "@/lib/safe-next";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell>
      <SignUpForm next={safeNextPath(params.next)} />
    </AuthShell>
  );
}
