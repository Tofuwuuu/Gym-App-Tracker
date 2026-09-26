"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Dumbbell,
  Ellipsis,
  History,
  LayoutDashboard,
  LineChart,
  LogOut,
  Play,
  UserRound,
  Users,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const moreLinks = [
  { href: "/routines", label: "Routines", icon: CalendarDays },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/feed", label: "Feed", icon: Users },
];

function isCurrent(pathname: string, href: string) {
  if (href === "/dashboard") return pathname === "/dashboard";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function TabLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="size-5" />
      {label}
    </Link>
  );
}

export function MobileTabBar({
  username,
  name,
}: {
  username?: string | null;
  name?: string | null;
}) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive =
    moreLinks.some((item) => isCurrent(pathname, item.href)) ||
    (username ? isCurrent(pathname, `/profile/${username}`) : false);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background md:hidden"
        style={{
          height: "calc(64px + env(safe-area-inset-bottom))",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="grid h-16 grid-cols-5">
          <TabLink
            href="/dashboard"
            label="Overview"
            icon={LayoutDashboard}
            active={isCurrent(pathname, "/dashboard")}
          />
          <TabLink
            href="/history"
            label="History"
            icon={History}
            active={isCurrent(pathname, "/history")}
          />
          <Link
            href="/workout/new"
            aria-current={isCurrent(pathname, "/workout") ? "page" : undefined}
            className="relative flex h-16 flex-col items-center justify-end pb-1.5 text-[11px] font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="absolute -top-4 flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_8px_20px_rgb(214_255_63/0.28)]">
              <Play className="size-6 fill-current" />
            </span>
            Start
          </Link>
          <TabLink
            href="/progress"
            label="Progress"
            icon={LineChart}
            active={isCurrent(pathname, "/progress")}
          />
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              moreActive || moreOpen ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Ellipsis className="size-5" />
            More
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-border pb-[max(1rem,env(safe-area-inset-bottom))]"
        >
          <SheetHeader>
            <SheetTitle className="font-heading text-xl uppercase tracking-wide">More</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col px-2 pb-2">
            {moreLinks.map((item) => {
              const Icon = item.icon;
              const active = isCurrent(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base",
                    active ? "bg-primary/10 text-foreground" : "text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
                  {item.label}
                </Link>
              );
            })}
            {username ? (
              <Link
                href={`/profile/${username}`}
                onClick={() => setMoreOpen(false)}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base",
                  isCurrent(pathname, `/profile/${username}`)
                    ? "bg-primary/10 text-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <UserRound className="size-5 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block">{name ?? "Profile"}</span>
                  <span className="block text-sm text-muted-foreground">@{username}</span>
                </span>
              </Link>
            ) : null}
            <form action={signOutAction}>
              <button
                type="submit"
                className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 text-base text-foreground hover:bg-muted"
              >
                <LogOut className="size-5 text-muted-foreground" />
                Sign out
              </button>
            </form>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
