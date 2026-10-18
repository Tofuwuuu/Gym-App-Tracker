import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getGoogleAuthCredentials } from "@/lib/google-auth";
import { safeNextPath } from "@/lib/safe-next";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const googleEnabled = getGoogleAuthCredentials() !== null;

  return (
    <AuthShell>
      {/* `next` is the param; `callbackUrl` is what the middleware sets. Both are validated. */}
      <SignInForm next={safeNextPath(params.next ?? params.callbackUrl)} googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
