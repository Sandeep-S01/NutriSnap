"use client";

import { BarChart3, CalendarDays, ScanLine, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const mobileNavItems = [
  { href: "/dashboard", label: "Today", icon: CalendarDays },
  { href: "/upload", label: "Scan", icon: ScanLine, primary: true },
  { href: "/meals", label: "Meals", icon: Utensils },
  { href: "/analytics", label: "Insights", icon: BarChart3 },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border-subtle bg-white/95 px-5 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2 shadow-[0_-12px_35px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 items-end">
        {mobileNavItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={`${item.href}-${item.label}`}
              href={item.href}
              className="flex min-h-14 flex-col items-center justify-end gap-1 text-xs font-medium text-slate-500"
            >
              <span
                className={[
                  "flex items-center justify-center transition",
                  item.primary
                    ? "mb-1 size-14 rounded-full border-4 border-white bg-primary text-white shadow-[0_12px_30px_rgba(4,120,87,0.35)]"
                    : "size-7 rounded-md",
                  isActive && !item.primary ? "text-primary" : "",
                ].join(" ")}
              >
                <item.icon
                  className={item.primary ? "size-6" : "size-5"}
                  aria-hidden="true"
                />
              </span>
              <span
                className={[
                  "leading-none",
                  isActive ? "text-primary" : "text-slate-500",
                ].join(" ")}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
