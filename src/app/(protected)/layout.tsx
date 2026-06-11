import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-dvh bg-background pb-24 lg:pb-0 lg:pl-64">
      <AppSidebar />
      <div className="min-h-dvh">{children}</div>
      <MobileBottomNav />
    </div>
  );
}
