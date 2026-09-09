"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Dumbbell,
  History,
  Home,
  Library,
  LineChart,
  LogOut,
  Menu,
  Users,
} from "lucide-react";
import { signOutAction } from "@/lib/actions/auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const links = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/workout/new", label: "Workout", icon: Dumbbell },
  { href: "/routines", label: "Routines", icon: Activity },
  { href: "/history", label: "History", icon: History },
  { href: "/progress", label: "Progress", icon: LineChart },
  { href: "/exercises", label: "Exercises", icon: Library },
  { href: "/feed", label: "Feed", icon: Users },
];

export function AppNav({
  username,
  name,
}: {
  username?: string | null;
  name?: string | null;
}) {
  const pathname = usePathname();

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r bg-card p-4 md:flex md:flex-col">
        <Link href="/dashboard" className="mb-6 flex items-center gap-2 px-2">
          <Dumbbell className="size-5 text-primary" />
          <span className="font-semibold tracking-tight">Gym Tracker</span>
        </Link>
        <NavLinks />
        <div className="mt-auto space-y-3 border-t pt-4">
          {username && (
            <Link
              href={`/profile/${username}`}
              className="block truncate px-2 text-sm text-muted-foreground hover:text-foreground"
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
      </aside>

      <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:hidden">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Dumbbell className="size-5" />
          Gym Tracker
        </Link>
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="icon" />}>
            <Menu className="size-4" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-4">
            <SheetHeader className="mb-4 px-0">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <NavLinks />
            <form action={signOutAction} className="mt-6">
              <Button type="submit" variant="outline" className="w-full gap-2">
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}
