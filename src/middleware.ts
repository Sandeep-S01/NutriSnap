import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedPageRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/upload(.*)",
  "/meals(.*)",
  "/analytics(.*)",
  "/profile(.*)",
]);

const isProtectedApiRoute = createRouteMatcher([
  "/api/meals(.*)",
  "/api/preferences(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  if (isProtectedApiRoute(request)) {
    await auth.protect();
  }

  if (isProtectedPageRoute(request)) {
    const { userId } = await auth();

    if (!userId) {
      const signInUrl = new URL("/sign-in", request.url);
      signInUrl.searchParams.set("redirect_url", request.nextUrl.href);

      return NextResponse.redirect(signInUrl);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
