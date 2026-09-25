import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { changeUserEmail, changeUserPassword, deleteUserAccount } from "./account-mutations";
import { DEMO_ACCOUNT_LOCKED_MESSAGE, DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD } from "./demo-account";
import { seedDatabase } from "./demo-seed";

const prisma = new PrismaClient();
const LOCKED = DEMO_ACCOUNT_LOCKED_MESSAGE;
const NORMAL_EMAIL = "lockcheck@example.com";
const ORIGINAL_PASSWORD = "original1";
const UPDATED_PASSWORD = "updatedpass";

describe("demo account lock", () => {
  let demoId = "";
  let normalId = "";

  before(async () => {
    await prisma.user.deleteMany({
      where: { OR: [{ email: NORMAL_EMAIL }, { username: "lockcheck" }] },
    });
    await seedDatabase(prisma, { resetDemo: true });
    const demo = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL } });
    demoId = demo.id;

    const passwordHash = await bcrypt.hash(ORIGINAL_PASSWORD, 12);
    const normal = await prisma.user.create({
      data: {
        name: "Lock Check",
        username: "lockcheck",
        email: NORMAL_EMAIL,
        passwordHash,
      },
    });
    normalId = normal.id;
  });

  after(async () => {
    await prisma.user.deleteMany({ where: { email: NORMAL_EMAIL } });
    await prisma.$disconnect();
  });

  it("refuses demo email, password, and account deletion without writing", async () => {
    const beforeUser = await prisma.user.findUniqueOrThrow({ where: { id: demoId } });

    const emailResult = await changeUserEmail(prisma, demoId, "hijack@example.com");
    const passwordResult = await changeUserPassword(prisma, demoId, "newpassword");
    const deleteResult = await deleteUserAccount(prisma, demoId);

    assert.equal(emailResult.error, LOCKED);
    assert.equal(passwordResult.error, LOCKED);
    assert.equal(deleteResult.error, LOCKED);

    const afterUser = await prisma.user.findUniqueOrThrow({ where: { id: demoId } });
    assert.equal(afterUser.email, beforeUser.email);
    assert.equal(afterUser.name, beforeUser.name);
    assert.equal(afterUser.passwordHash, beforeUser.passwordHash);
    assert.equal(await bcrypt.compare(DEMO_PASSWORD, afterUser.passwordHash ?? ""), true);
  });

  it("lets a normal user change their own password", async () => {
    const result = await changeUserPassword(prisma, normalId, UPDATED_PASSWORD);
    assert.equal(result.success, true);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: normalId } });
    assert.equal(await bcrypt.compare(UPDATED_PASSWORD, updated.passwordHash ?? ""), true);
    assert.equal(await bcrypt.compare(ORIGINAL_PASSWORD, updated.passwordHash ?? ""), false);
    assert.equal(updated.email, NORMAL_EMAIL);
  });

  it("restores demo email, name, and password, and recreates a deleted demo user", async () => {
    await prisma.user.update({
      where: { id: demoId },
      data: {
        email: "taken-over@example.com",
        name: "Taken Over",
        passwordHash: await bcrypt.hash("attacker1", 12),
      },
    });

    await seedDatabase(prisma, { resetDemo: true });

    const restored = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL } });
    assert.equal(restored.id, demoId);
    assert.equal(restored.name, DEMO_NAME);
    assert.equal(await bcrypt.compare(DEMO_PASSWORD, restored.passwordHash ?? ""), true);
    assert.equal(await bcrypt.compare("attacker1", restored.passwordHash ?? ""), false);

    const normalAfterRestore = await prisma.user.findUniqueOrThrow({ where: { id: normalId } });
    assert.equal(normalAfterRestore.email, NORMAL_EMAIL);
    assert.equal(await bcrypt.compare(UPDATED_PASSWORD, normalAfterRestore.passwordHash ?? ""), true);

    await prisma.user.delete({ where: { id: demoId } });
    assert.equal(await prisma.user.findUnique({ where: { email: DEMO_EMAIL } }), null);

    await seedDatabase(prisma, { resetDemo: true });

    const recreated = await prisma.user.findUniqueOrThrow({ where: { email: DEMO_EMAIL } });
    assert.notEqual(recreated.id, demoId);
    assert.equal(recreated.name, DEMO_NAME);
    assert.equal(recreated.username, "demo");
    assert.equal(await bcrypt.compare(DEMO_PASSWORD, recreated.passwordHash ?? ""), true);

    const normalAfterRecreate = await prisma.user.findUniqueOrThrow({ where: { id: normalId } });
    assert.equal(normalAfterRecreate.email, NORMAL_EMAIL);
    assert.equal(await bcrypt.compare(UPDATED_PASSWORD, normalAfterRecreate.passwordHash ?? ""), true);
    demoId = recreated.id;
  });
});
