"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signInAction, signInWithGoogle, type ActionResult } from "@/lib/actions/auth";
import { Wordmark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionResult = {};

export function SignInForm({
  callbackUrl,
  googleEnabled,
}: {
  callbackUrl?: string;
  googleEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(signInAction, initial);

  return (
    <div className="space-y-6">
      <div className="space-y-3 lg:hidden">
        <Wordmark />
      </div>
      <div>
        <h1 className="font-heading text-4xl font-semibold uppercase tracking-wide">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick up the log where you left it.</p>
      </div>
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="callbackUrl" value={callbackUrl || "/dashboard"} />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      {googleEnabled && (
        <form action={signInWithGoogle}>
          <Button type="submit" variant="outline" className="w-full" size="lg">
            Continue with Google
          </Button>
        </form>
      )}

      <p className="text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/sign-up" className="font-medium text-primary underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
