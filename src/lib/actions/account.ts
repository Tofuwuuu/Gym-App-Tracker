"use server";

import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import {
  changeUserEmail,
  changeUserPassword,
  deleteUserAccount,
  type AccountMutationResult,
} from "@/lib/account-mutations";
import { DEMO_ACCOUNT_LOCKED_MESSAGE, isDemoAccountEmail } from "@/lib/demo-account";

async function refuseActingDemoUser(userId: string): Promise<AccountMutationResult | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user) return { error: "Account not found" };
  if (isDemoAccountEmail(user.email)) {
    return { error: DEMO_ACCOUNT_LOCKED_MESSAGE };
  }
  return null;
}

export async function changeEmailAction(
  _prev: AccountMutationResult,
  formData: FormData
): Promise<AccountMutationResult> {
  const sessionUser = await requireUser();
  const refused = await refuseActingDemoUser(sessionUser.id);
  if (refused) return refused;
  return changeUserEmail(prisma, sessionUser.id, String(formData.get("email") ?? ""));
}

export async function changePasswordAction(
  _prev: AccountMutationResult,
  formData: FormData
): Promise<AccountMutationResult> {
  const sessionUser = await requireUser();
  const refused = await refuseActingDemoUser(sessionUser.id);
  if (refused) return refused;
  return changeUserPassword(prisma, sessionUser.id, String(formData.get("password") ?? ""));
}

export async function deleteAccountAction(): Promise<AccountMutationResult> {
  const sessionUser = await requireUser();
  const refused = await refuseActingDemoUser(sessionUser.id);
  if (refused) return refused;
  return deleteUserAccount(prisma, sessionUser.id);
}
