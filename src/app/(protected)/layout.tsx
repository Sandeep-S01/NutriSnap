import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";

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
    <div className="min-h-dvh bg-background">
      <AppHeader />
      {children}
    </div>
  );
}
