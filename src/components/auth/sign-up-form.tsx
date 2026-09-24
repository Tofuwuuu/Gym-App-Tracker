"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpAction, type ActionResult } from "@/lib/actions/auth";
import { Wordmark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionResult = {};

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUpAction, initial);

  return (
    <div className="space-y-6">
      <div className="space-y-3 lg:hidden">
        <Wordmark />
      </div>
      <div>
        <h1 className="font-heading text-4xl font-semibold uppercase tracking-wide">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Start a training log in under a minute.</p>
      </div>
      <form action={formAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" name="username" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" required minLength={8} />
        </div>
        {state.error && <p className="text-sm text-destructive">{state.error}</p>}
        <Button type="submit" className="w-full" size="lg" disabled={pending}>
          {pending ? "Creating..." : "Create account"}
        </Button>
      </form>
      <p className="text-sm text-muted-foreground">
        Already training here?{" "}
        <Link href="/sign-in" className="font-medium text-primary underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
