"use server";

import { auth, currentUser } from "@clerk/nextjs/server";

export async function requireCurrentUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Authentication required.");
  }

  const user = await currentUser();

  if (!user) {
    throw new Error("Authenticated user could not be loaded.");
  }

  return user;
}
