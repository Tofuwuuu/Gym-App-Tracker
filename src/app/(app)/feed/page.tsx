import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { calculateVolume, formatDuration } from "@/lib/workout-utils";
import { LikeButton } from "@/components/social/social-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Feed</h1>
        <p className="text-muted-foreground">
          Workouts from people you follow (and your own).
        </p>
      </div>

      {followingIds.length === 0 && (
        <Card>
          <CardContent className="space-y-3 py-6">
            <p className="text-sm text-muted-foreground">
              You are not following anyone yet. Open a profile and hit Follow to fill this feed.
            </p>
            {user.username && (
              <Button variant="outline" render={<Link href={`/profile/${user.username}`} />}>
                View your profile
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {workouts.map((workout) => {
          const volume = workout.exercises.reduce(
            (sum, ex) => sum + calculateVolume(ex.sets),
            0
          );
          const liked = workout.likes.some((like) => like.userId === user.id);
          return (
            <Card key={workout.id}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between gap-2 text-base">
                  <Link
                    href={
                      workout.user.username
                        ? `/profile/${workout.user.username}`
                        : `/history/${workout.id}`
                    }
                    className="hover:underline"
                  >
                    {workout.user.username
                      ? `@${workout.user.username}`
                      : workout.user.name ?? "Athlete"}
                  </Link>
                  <span className="text-sm font-normal text-muted-foreground">
                    {formatDistanceToNow(workout.startedAt, { addSuffix: true })}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {workout.exercises.map((ex) => ex.exercise.name).join(" · ")}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-sm">
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
                      size="sm"
                      variant="outline"
                      render={<Link href={`/history/${workout.id}`} />}
                    >
                      Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {workouts.length === 0 && (
          <p className="text-sm text-muted-foreground">No feed activity yet.</p>
        )}
      </div>
    </div>
  );
}
