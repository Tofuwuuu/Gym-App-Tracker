import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { calculateVolume, formatDuration } from "@/lib/workout-utils";
import { LikeButton } from "@/components/social/social-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const workout = await prisma.workout.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, username: true } },
      exercises: {
        orderBy: { order: "asc" },
        include: {
          exercise: true,
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
      likes: true,
    },
  });

  if (!workout) notFound();

  // In-progress workouts are private to the owner
  if (!workout.endedAt && workout.userId !== user.id) {
    notFound();
  }

  const volume = workout.exercises.reduce((sum, ex) => sum + calculateVolume(ex.sets), 0);
  const liked = workout.likes.some((like) => like.userId === user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {format(workout.startedAt, "EEEE, MMM d")}
          </h1>
          <p className="text-muted-foreground">
            {workout.user.username ? `@${workout.user.username}` : workout.user.name} ·{" "}
            {formatDuration(workout.startedAt, workout.endedAt)} ·{" "}
            {Math.round(volume).toLocaleString()} kg volume
          </p>
        </div>
        {workout.endedAt && (
          <LikeButton workoutId={workout.id} liked={liked} count={workout.likes.length} />
        )}
      </div>

      {workout.notes && (
        <Card>
          <CardContent className="py-4 text-sm">{workout.notes}</CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {workout.exercises.map((ex) => (
          <Card key={ex.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{ex.exercise.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ex.sets.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center justify-between rounded-md bg-muted/40 px-3 py-2 text-sm"
                >
                  <span>Set {set.setNumber}</span>
                  <div className="flex items-center gap-2">
                    {set.isWarmup && <Badge variant="secondary">Warmup</Badge>}
                    <span className="font-medium">
                      {set.weight} kg × {set.reps}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
