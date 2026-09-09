import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { startWorkout } from "@/lib/actions/gym";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewWorkoutPage() {
  const user = await requireUser();
  const routines = await prisma.routine.findMany({
    where: { userId: user.id },
    include: {
      exercises: { include: { exercise: true }, orderBy: { order: "asc" } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const active = await prisma.workout.findFirst({
    where: { userId: user.id, endedAt: null },
    orderBy: { startedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Start workout</h1>
        <p className="text-muted-foreground">Pick a routine or start from scratch.</p>
      </div>

      {active && (
        <Card className="border-primary/40">
          <CardContent className="flex items-center justify-between gap-3 py-4">
            <p className="text-sm">You have a workout in progress.</p>
            <Button render={<Link href={`/workout/${active.id}`} />}>Resume</Button>
          </CardContent>
        </Card>
      )}

      <form action={startWorkout}>
        <Button type="submit" className="w-full" size="lg">
          Empty workout
        </Button>
      </form>

      <div className="space-y-3">
        <h2 className="text-lg font-medium">From routine</h2>
        {routines.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No routines yet.{" "}
            <Link href="/routines/new" className="underline">
              Create one
            </Link>
          </p>
        )}
        {routines.map((routine) => (
          <Card key={routine.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{routine.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                {routine.exercises.map((ex) => ex.exercise.name).join(", ")}
              </p>
              <form action={startWorkout.bind(null, routine.id)}>
                <Button type="submit" size="sm">
                  Start
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
