import { UserButton } from "@clerk/nextjs";
import {
  ChartNoAxesColumnIncreasing,
  LayoutDashboard,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import { NutriSnapLogo } from "@/components/nutrisnap-logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesColumnIncreasing },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppHeader() {
  return (
    <header className="hidden border-b border-slate-200 bg-white lg:block">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/dashboard" className="flex items-center gap-3">
          <NutriSnapLogo markClassName="size-9" />
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            >
              <item.icon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          ))}
          <div className="ml-2 flex items-center">
            <UserButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
