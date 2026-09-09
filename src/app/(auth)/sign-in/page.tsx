import { SignInForm } from "@/components/auth/sign-in-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const params = await searchParams;
  const googleEnabled = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <SignInForm callbackUrl={params.callbackUrl} googleEnabled={googleEnabled} />
    </div>
  );
}
