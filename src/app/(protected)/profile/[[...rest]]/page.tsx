import { UserProfile } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function ProfilePage() {
  const user = await currentUser();
  const displayName =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? "Your profile";

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 sm:px-8 lg:px-10">
      <section className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          User profile
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950">
          {displayName}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          Manage account details, security, and connected sign-in methods.
        </p>
      </section>

      <UserProfile
        appearance={{
          elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-sm",
          },
        }}
      />
    </main>
  );
}
