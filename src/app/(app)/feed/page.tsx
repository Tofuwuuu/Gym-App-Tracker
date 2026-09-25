import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { calculateVolume, formatDuration } from "@/lib/workout-utils";
import { LikeButton } from "@/components/social/social-actions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";

export default async function FeedPage() {
  const user = await requireUser();

  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  const workouts = await prisma.workout.findMany({
    where: {
      endedAt: { not: null },
      userId: { in: [...followingIds, user.id] },
    },
    orderBy: { startedAt: "desc" },
    take: 30,
    include: {
      user: { select: { id: true, name: true, username: true, image: true } },
      exercises: {
        include: { exercise: true, sets: true },
      },
      likes: true,
    },
  });

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Social"
        title="Feed"
        description="Workouts from people you follow, plus your own."
      />

      {followingIds.length === 0 && (
        <div className="surface space-y-3 px-4 py-5">
          <p className="text-sm text-muted-foreground">
            You are not following anyone yet. Open a profile and hit Follow to fill this feed.
          </p>
          {user.username && (
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={`/profile/${user.username}`} />}
            >
              View your profile
            </Button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {workouts.map((workout) => {
          const volume = workout.exercises.reduce(
            (sum, ex) => sum + calculateVolume(ex.sets),
            0
          );
          const liked = workout.likes.some((like) => like.userId === user.id);
          return (
            <article
              key={workout.id}
              className="space-y-3 rounded-xl border border-border border-l-2 border-l-primary bg-card px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={
                    workout.user.username
                      ? `/profile/${workout.user.username}`
                      : `/history/${workout.id}`
                  }
                  className="font-heading text-xl uppercase tracking-wide hover:text-primary"
                >
                  {workout.user.username
                    ? `@${workout.user.username}`
                    : workout.user.name ?? "Athlete"}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(workout.startedAt, { addSuffix: true })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {workout.exercises.map((ex) => ex.exercise.name).join(" · ")}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-mono text-sm text-primary">
                  {formatDuration(workout.startedAt, workout.endedAt)} ·{" "}
                  {Math.round(volume).toLocaleString()} kg
                </p>
                <div className="flex items-center gap-2">
                  <LikeButton
                    workoutId={workout.id}
                    liked={liked}
                    count={workout.likes.length}
                  />
                  <Button
                    nativeButton={false}
                    size="sm"
                    variant="outline"
                    render={<Link href={`/history/${workout.id}`} />}
                  >
                    Details
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
        {workouts.length === 0 && (
          <p className="text-sm text-muted-foreground">No feed activity yet.</p>
        )}
      </div>
    </div>
  );
}
