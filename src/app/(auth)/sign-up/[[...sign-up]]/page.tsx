import { SignUp } from "@clerk/nextjs";
import { NutriSnapLogo } from "@/components/nutrisnap-logo";

export default function SignUpPage() {
  return (
    <main className="grid min-h-dvh bg-background px-5 py-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:px-8">
      <section className="hidden items-center lg:flex">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase text-primary">
            Start tracking
          </p>
          <h1 className="mt-3 text-[40px] font-semibold leading-tight text-slate-950">
            Create a workspace for your meal scans.
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Save AI nutrition estimates, track daily intake, and review your
            most common foods over time.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <NutriSnapLogo className="justify-center" markClassName="size-12" />
            <p className="mt-2 text-sm text-slate-600">
              Create an account to save meal history.
            </p>
          </div>
          <SignUp
            appearance={{
              elements: {
                rootBox: "mx-auto",
                cardBox: "shadow-sm",
              },
            }}
            signInUrl="/sign-in"
          />
        </div>
      </section>
    </main>
  );
}
