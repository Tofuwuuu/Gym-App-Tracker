import { PrismaClient } from "@prisma/client";
import { DEMO_EMAIL, DEMO_PASSWORD } from "../src/lib/demo-account";
import { seedDatabase } from "../src/lib/demo-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding exercise library and demo lifter...");
  const result = await seedDatabase(prisma);

  console.log(`Seeded ${result.exerciseCount} exercises.`);
  if (result.history === "present") {
    console.log("Demo history already present.");
  }
  console.log(`Demo lifter ready: ${DEMO_EMAIL} / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
