import { SignUp } from "@clerk/nextjs";
import { NutriSnapLogo } from "@/components/nutrisnap-logo";

export default function SignUpPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <NutriSnapLogo
            className="justify-center"
            markClassName="size-12"
          />
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
    </main>
  );
}
