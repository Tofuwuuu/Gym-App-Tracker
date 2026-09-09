import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { FollowButton } from "@/components/social/social-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const currentUser = await requireUser();
  const { username } = await params;

  const profile = await prisma.user.findUnique({
    where: { username },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          workouts: { where: { endedAt: { not: null } } },
        },
      },
      workouts: {
        where: { endedAt: { not: null } },
        orderBy: { startedAt: "desc" },
        take: 10,
        include: {
          exercises: { include: { exercise: true } },
        },
      },
    },
  });

  if (!profile) notFound();

  const isFollowing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUser.id,
        followingId: profile.id,
      },
    },
  });

  const initials = (profile.name ?? profile.username ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 py-6">
          <Avatar className="size-16">
            <AvatarImage src={profile.image ?? undefined} alt={profile.name ?? username} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile.name ?? `@${username}`}
            </h1>
            <p className="text-muted-foreground">@{username}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile._count.workouts} workouts · {profile._count.followers} followers ·{" "}
              {profile._count.following} following
            </p>
          </div>
          {currentUser.id !== profile.id && (
            <FollowButton username={username} isFollowing={Boolean(isFollowing)} />
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-medium">Recent workouts</h2>
        {profile.workouts.length === 0 && (
          <p className="text-sm text-muted-foreground">No public workouts yet.</p>
        )}
        {profile.workouts.map((workout) => (
          <Card key={workout.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                <Link href={`/history/${workout.id}`} className="hover:underline">
                  {formatDistanceToNow(workout.startedAt, { addSuffix: true })}
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {workout.exercises.map((ex) => ex.exercise.name).join(" · ")}
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
