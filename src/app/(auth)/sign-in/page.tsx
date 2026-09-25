import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { getGoogleAuthCredentials } from "@/lib/google-auth";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const googleEnabled = getGoogleAuthCredentials() !== null;

  return (
    <AuthShell>
      <SignInForm callbackUrl={params.callbackUrl} googleEnabled={googleEnabled} />
    </AuthShell>
  );
}
