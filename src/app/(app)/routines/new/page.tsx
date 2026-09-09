import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { RoutineBuilder } from "@/components/routines/routine-builder";

export default async function NewRoutinePage() {
  const user = await requireUser();
  const exercises = await prisma.exercise.findMany({
    where: {
      OR: [{ isCustom: false }, { createdById: user.id }],
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">New routine</h1>
        <p className="text-muted-foreground">Build a template you can start in one tap.</p>
      </div>
      <RoutineBuilder exerciseLibrary={exercises} />
    </div>
  );
}
