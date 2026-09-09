"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  Database,
  History,
  Library,
  LineChart,
  LogOut,
  Menu,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { BrandMark } from "@/components/brand/brand-mark";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const quickActions = [
  { href: "/workout/new", label: "Start Workout", icon: Plus },
  { href: "/routines/new", label: "New Routine", icon: Plus },
  { href: "/exercises", label: "Custom Exercise", icon: Plus },
];

const analyticsLinks = [{ href: "/progress", label: "Analytics", icon: LineChart }];

const databaseLinks = [
  { href: "/history", label: "Workouts", icon: History },
  { href: "/routines", label: "Splits", icon: CalendarDays },
  { href: "/exercises", label: "Exercises", icon: Library },
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
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
        active
          ? "bg-accent font-medium text-accent-foreground"
          : "text-foreground/80 hover:bg-muted"
      )}
    >
      <Icon className={cn("size-4", active ? "text-fitness" : "text-fitness/80")} />
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
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="flex h-full flex-col gap-5">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex flex-col items-start gap-3 px-1"
      >
        <BrandMark className="size-12 rounded-2xl" iconClassName="size-8" />
        <div>
          <p className="text-xl font-semibold tracking-tight">Fitness Tracker</p>
          <p className="text-xs text-muted-foreground">Train. Log. Progress.</p>
        </div>
      </Link>

      <div className="notion-panel p-2">
        <p className="px-2.5 py-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Quick Actions
        </p>
        <div className="space-y-0.5">
          {quickActions.map((item) => (
            <Link
              key={item.href + item.label}
              href={item.href}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-foreground/90 hover:bg-muted"
            >
              <item.icon className="size-4 text-fitness" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="space-y-4 px-1">
        <div>
          <p className="mb-1 px-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Analytics
          </p>
          {analyticsLinks.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
        </div>

        <div>
          <p className="mb-1 px-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Databases
          </p>
          {databaseLinks.map((item) => (
            <NavItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
          <NavItem
            href="/dashboard"
            label="Overview"
            icon={Database}
            active={pathname === "/dashboard"}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      <div className="mt-auto space-y-2 border-t pt-4">
        {username && (
          <Link
            href={`/profile/${username}`}
            onClick={onNavigate}
            className="block truncate px-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            @{username}
            {name ? ` · ${name}` : ""}
          </Link>
        )}
        <form action={signOutAction}>
          <Button type="submit" variant="ghost" className="w-full justify-start gap-2">
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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 flex h-12 items-center justify-between border-b bg-white/90 px-4 backdrop-blur md:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground">
          <BrandMark className="size-6 rounded-md" iconClassName="size-4" />
          <span>Fitness Tracker</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="hidden text-muted-foreground sm:inline-flex">
            <Search className="size-4" />
            Search
          </Button>
          <Sheet>
            <SheetTrigger
              render={<Button variant="outline" size="icon" className="md:hidden" />}
            >
              <Menu className="size-4" />
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-4">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <SidebarBody username={username} name={name} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 md:px-6">
        <aside className="hidden w-64 shrink-0 md:block">
          <div className="sticky top-20">
            <SidebarBody username={username} name={name} />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
