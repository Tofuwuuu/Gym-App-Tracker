"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { signUpSchema } from "@/lib/validations";

export type ActionResult = {
  error?: string;
  success?: boolean;
};

export async function signUpAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const email = parsed.data.email.toLowerCase();
  const username = parsed.data.username.toLowerCase();

  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email }, { username }],
    },
  });

  if (existing) {
    return { error: "Email or username already in use" };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);

  await prisma.user.create({
    data: {
      name: parsed.data.name,
      username,
      email,
      passwordHash,
    },
  });

  try {
    await signIn("credentials", {
      email,
      password: parsed.data.password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Try signing in." };
    }
    throw error;
  }

  return { success: true };
}

export async function signInAction(
  _prev: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "/dashboard");

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password" };
    }
    throw error;
  }

  return { success: true };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function signInWithGoogle() {
  await signIn("google", { redirectTo: "/dashboard" });
}
