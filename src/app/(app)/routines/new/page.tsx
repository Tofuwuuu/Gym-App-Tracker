import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { RoutineBuilder } from "@/components/routines/routine-builder";
import { PageHeader } from "@/components/layout/page-header";

export default async function NewRoutinePage() {
  const user = await requireUser();
  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [{ isCustom: false }, { createdById: user.id }],
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Templates"
        title="New routine"
        description="Build a template you can start in one tap."
      />
      <RoutineBuilder exerciseLibrary={exercises} />
    </div>
  );
}
