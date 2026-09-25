import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { calculateVolume, formatDuration, formatSetLoad } from "@/lib/workout-utils";
import { LikeButton } from "@/components/social/social-actions";
import { PageHeader } from "@/components/layout/page-header";
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
    <div className="space-y-5">
      <PageHeader
        eyebrow={workout.user.username ? `@${workout.user.username}` : workout.user.name ?? "Session"}
        title={format(workout.startedAt, "EEEE, MMM d")}
        description={`${formatDuration(workout.startedAt, workout.endedAt)} · ${Math.round(volume).toLocaleString()} kg volume`}
        action={
          workout.endedAt ? (
            <LikeButton workoutId={workout.id} liked={liked} count={workout.likes.length} />
          ) : null
        }
      />

      {workout.notes && (
        <p className="surface px-4 py-3 text-sm text-muted-foreground">{workout.notes}</p>
      )}

      <div className="space-y-3">
        {workout.exercises.map((ex) => (
          <section key={ex.id} className="surface px-4 py-3">
            <h2 className="font-heading text-xl uppercase tracking-wide">{ex.exercise.name}</h2>
            <div className="mt-2 space-y-1.5">
              {ex.sets.map((set) => (
                <div
                  key={set.id}
                  className="flex items-center justify-between rounded-md bg-muted/60 px-3 py-2 text-sm"
                >
                  <span className="font-mono text-muted-foreground">{set.setNumber}</span>
                  <div className="flex items-center gap-2">
                    {set.isWarmup && <Badge variant="secondary">Warmup</Badge>}
                    <span className="font-mono">{formatSetLoad(set)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
