"use client";

import { UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  CalendarDays,
  ScanLine,
  Settings,
  Utensils,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NutriSnapLogo } from "@/components/nutrisnap-logo";

const navItems = [
  { href: "/upload", label: "Scan", icon: ScanLine },
  { href: "/dashboard", label: "Today", icon: CalendarDays },
  { href: "/meals", label: "Meals", icon: Utensils },
  { href: "/analytics", label: "Insights", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: Settings },
];

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border-subtle bg-surface lg:flex lg:flex-col">
      <div className="flex h-16 items-center border-b border-border-subtle px-5">
        <Link href="/dashboard" className="flex items-center gap-3">
          <NutriSnapLogo markClassName="size-9" />
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4" aria-label="Primary navigation">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = isActivePath(pathname, item.href);

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={[
                  "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                  isActive
                    ? "bg-primary-soft text-primary"
                    : "text-slate-600 hover:bg-surface-muted hover:text-slate-950",
                ].join(" ")}
              >
                <item.icon className="size-[18px]" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-border-subtle p-4">
        <div className="flex items-center justify-between rounded-md bg-surface-muted px-3 py-2">
          <div>
            <p className="text-sm font-medium text-slate-950">Workspace</p>
            <p className="text-xs text-muted-foreground">Private nutrition log</p>
          </div>
          <UserButton />
        </div>
      </div>
    </aside>
  );
}
