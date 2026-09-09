"use client";

import { useTransition } from "react";
import { Heart, UserPlus, UserMinus } from "lucide-react";
import { toggleFollow, toggleWorkoutLike } from "@/lib/actions/gym";
import { Button } from "@/components/ui/button";

export function FollowButton({
  username,
  isFollowing,
}: {
  username: string;
  isFollowing: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant={isFollowing ? "outline" : "default"}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleFollow(username);
        })
      }
    >
      {isFollowing ? (
        <>
          <UserMinus className="size-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="size-4" />
          Follow
        </>
      )}
    </Button>
  );
}

export function LikeButton({
  workoutId,
  liked,
  count,
}: {
  workoutId: string;
  liked: boolean;
  count: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleWorkoutLike(workoutId);
        })
      }
    >
      <Heart className={`size-4 ${liked ? "fill-red-500 text-red-500" : ""}`} />
      {count}
    </Button>
  );
}
