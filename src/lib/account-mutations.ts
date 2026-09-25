import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { DEMO_ACCOUNT_LOCKED_MESSAGE, isDemoAccountEmail } from "@/lib/demo-account";

export type AccountMutationResult = {
  error?: string;
  success?: boolean;
};

async function actingUser(prisma: PrismaClient, userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, passwordHash: true },
  });
}

function refuseDemoAccount(email: string | null | undefined): AccountMutationResult | null {
  if (isDemoAccountEmail(email)) {
    return { error: DEMO_ACCOUNT_LOCKED_MESSAGE };
  }
  return null;
}

export async function changeUserEmail(
  prisma: PrismaClient,
  userId: string,
  nextEmail: string
): Promise<AccountMutationResult> {
  const user = await actingUser(prisma, userId);
  if (!user) return { error: "Account not found" };

  const refused = refuseDemoAccount(user.email);
  if (refused) return refused;

  const email = nextEmail.trim().toLowerCase();
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) return { error: "Invalid email" };
  if (parsed.data === user.email) return { success: true };

  const taken = await prisma.user.findUnique({ where: { email: parsed.data } });
  if (taken) return { error: "Email already in use" };

  await prisma.user.update({ where: { id: user.id }, data: { email: parsed.data } });
  return { success: true };
}

export async function changeUserPassword(
  prisma: PrismaClient,
  userId: string,
  nextPassword: string
): Promise<AccountMutationResult> {
  const user = await actingUser(prisma, userId);
  if (!user) return { error: "Account not found" };

  const refused = refuseDemoAccount(user.email);
  if (refused) return refused;

  if (nextPassword.length < 8) {
    return { error: "Password must be at least 8 characters" };
  }

  const passwordHash = await bcrypt.hash(nextPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
  return { success: true };
}

export async function deleteUserAccount(
  prisma: PrismaClient,
  userId: string
): Promise<AccountMutationResult> {
  const user = await actingUser(prisma, userId);
  if (!user) return { error: "Account not found" };

  const refused = refuseDemoAccount(user.email);
  if (refused) return refused;

  await prisma.user.delete({ where: { id: user.id } });
  return { success: true };
}
