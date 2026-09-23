"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Dumbbell,
  History,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Plus,
  Users,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/history", label: "History", icon: History },
  { href: "/routines", label: "Routines", icon: CalendarDays },
  { href: "/exercises", label: "Exercises", icon: Dumbbell },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/feed", label: "Feed", icon: Users },
];

function NavItem({
  href,
  label,
  icon: Icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/10 font-medium text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className={cn("size-4", active ? "text-primary" : "text-muted-foreground")} />
      {label}
    </Link>
  );
}

function SidebarBody({
  username,
  name,
  onNavigate,
}: {
  username?: string | null;
  name?: string | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname === href || pathname.startsWith(`${href}/`);

  const initials = (name ?? username ?? "FT")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-full flex-col gap-5">
      <Link href="/dashboard" onClick={onNavigate} className="px-1">
        <Wordmark />
      </Link>

      <Button className="w-full" render={<Link href="/workout/new" onClick={onNavigate} />}>
        <Plus className="size-4" />
        Start workout
      </Button>

      <nav className="space-y-0.5">
        {navLinks.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={isActive(item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="space-y-0.5 px-1">
        <p className="px-1.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Create
        </p>
        <Link
          href="/routines/new"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5 text-primary" />
          New routine
        </Link>
        <Link
          href="/exercises"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-3.5 text-primary" />
          Custom exercise
        </Link>
      </div>

      <div className="mt-auto space-y-2 border-t border-border pt-3">
        {username ? (
          <Link
            href={`/profile/${username}`}
            onClick={onNavigate}
            className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-muted"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{name ?? username}</span>
              <span className="block truncate text-xs text-muted-foreground">@{username}</span>
            </span>
          </Link>
        ) : null}
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" className="w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="size-4" />
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AppShell({
  username,
  name,
  children,
}: {
  username?: string | null;
  name?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 border-r border-border bg-sidebar px-3 py-4 md:flex">
        <SidebarBody username={username} name={name} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
          <Link href="/dashboard">
            <Wordmark compact />
          </Link>
          <Sheet>
            <SheetTrigger
              render={
                <Button variant="outline" size="icon" aria-label="Open navigation" />
              }
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-4">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarBody username={username} name={name} />
            </SheetContent>
          </Sheet>
        </header>

        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-5 md:px-8 md:py-7">
          {children}
        </main>
      </div>
    </div>
  );
}
