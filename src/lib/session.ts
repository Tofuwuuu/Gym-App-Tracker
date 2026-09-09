import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  return session.user;
}

export async function getOptionalUser() {
  const session = await auth();
  return session?.user ?? null;
}
