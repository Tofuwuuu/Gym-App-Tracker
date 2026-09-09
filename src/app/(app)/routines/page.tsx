import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { deleteRoutineForm, startWorkout } from "@/lib/actions/gym";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function RoutinesPage() {
  const user = await requireUser();
  const routines = await prisma.routine.findMany({
    where: { userId: user.id },
    include: {
      exercises: {
        include: { exercise: true },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Routines</h1>
          <p className="text-muted-foreground">Reusable workout templates.</p>
        </div>
        <Button render={<Link href="/routines/new" />}>New routine</Button>
      </div>

      {routines.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            No routines yet. Create Push, Pull, Legs — or whatever split you run.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {routines.map((routine) => (
            <Card key={routine.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{routine.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {routine.exercises.map((ex) => ex.exercise.name).join(" · ")}
                </p>
                <div className="flex flex-wrap gap-2">
                  <form action={startWorkout.bind(null, routine.id)}>
                    <Button type="submit" size="sm">
                      Start
                    </Button>
                  </form>
                  <Button
                    size="sm"
                    variant="outline"
                    render={<Link href={`/routines/${routine.id}/edit`} />}
                  >
                    Edit
                  </Button>
                  <form action={deleteRoutineForm.bind(null, routine.id)}>
                    <Button type="submit" size="sm" variant="destructive">
                      Delete
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
