import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { FollowButton } from "@/components/social/social-actions";
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-4 border-b border-border pb-5">
        <Avatar className="size-16">
          <AvatarImage src={profile.image ?? undefined} alt={profile.name ?? username} />
          <AvatarFallback className="bg-primary text-base font-semibold text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Athlete
          </p>
          <h1 className="font-heading text-4xl font-semibold uppercase leading-none tracking-wide">
            {profile.name ?? username}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">@{username}</p>
        </div>
        {currentUser.id !== profile.id && (
          <FollowButton username={username} isFollowing={Boolean(isFollowing)} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-border bg-border">
        {[
          [profile._count.workouts, "Workouts"],
          [profile._count.followers, "Followers"],
          [profile._count.following, "Following"],
        ].map(([value, label]) => (
          <div key={String(label)} className="bg-card px-3 py-3 text-center">
            <p className="font-heading text-3xl uppercase text-primary">{value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>

      <section className="space-y-2">
        <h2 className="font-heading text-2xl uppercase tracking-wide">Recent workouts</h2>
        {profile.workouts.length === 0 && (
          <p className="text-sm text-muted-foreground">No public workouts yet.</p>
        )}
        {profile.workouts.length > 0 && (
        <div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {profile.workouts.map((workout) => (
            <Link
              key={workout.id}
              href={`/history/${workout.id}`}
              className="block px-4 py-3 hover:bg-muted/60"
            >
              <p className="font-heading text-xl uppercase tracking-wide">
                {formatDistanceToNow(workout.startedAt, { addSuffix: true })}
              </p>
              <p className="truncate text-sm text-muted-foreground">
                {workout.exercises.map((ex) => ex.exercise.name).join(" · ")}
              </p>
            </Link>
          ))}
        </div>
        )}
      </section>
    </div>
  );
}
