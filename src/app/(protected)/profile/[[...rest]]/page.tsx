import { UserProfile } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { NutritionGoalsForm } from "@/features/preferences/nutrition-goals-form";
import { getUserPreference } from "@/server/preferences";

export default async function ProfilePage() {
  const user = await currentUser();
  const displayName =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Your profile";
  const preference = user
    ? await getUserPreference(user.id)
    : { dailyCaloriesTarget: 2000, dailyProteinTarget: 100 };

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8 lg:px-8 lg:py-7">
      <section className="mb-6">
        <p className="text-xs font-semibold uppercase text-primary">
          Profile
        </p>
        <h1 className="mt-2 text-[28px] font-semibold tracking-normal text-slate-950">
          {displayName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          Manage account details, security, and connected sign-in methods.
        </p>
      </section>

      <NutritionGoalsForm initialPreference={preference} />

      <section className="rounded-lg border border-border-subtle bg-surface p-4">
        <UserProfile
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "w-full shadow-none",
            },
          }}
        />
      </section>
    </main>
  );
}
