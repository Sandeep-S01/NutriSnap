import {
  DEFAULT_USER_PREFERENCES,
  type UserPreferenceInput,
} from "@/features/preferences/preference-validation";
import { prisma } from "@/server/db";
import type { UserPreference } from "@/types/preferences";

function toUserPreference(preference: UserPreferenceInput): UserPreference {
  return {
    dailyCaloriesTarget: preference.dailyCaloriesTarget,
    dailyProteinTarget: preference.dailyProteinTarget,
  };
}

export async function getUserPreference(
  clerkUserId: string,
): Promise<UserPreference> {
  const preference = await prisma.userPreference.findUnique({
    where: { clerkUserId },
    select: {
      dailyCaloriesTarget: true,
      dailyProteinTarget: true,
    },
  });

  return preference
    ? toUserPreference(preference)
    : { ...DEFAULT_USER_PREFERENCES };
}

export async function upsertUserPreference(
  clerkUserId: string,
  input: UserPreferenceInput,
) {
  const preference = await prisma.userPreference.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      dailyCaloriesTarget: input.dailyCaloriesTarget,
      dailyProteinTarget: input.dailyProteinTarget,
    },
    update: {
      dailyCaloriesTarget: input.dailyCaloriesTarget,
      dailyProteinTarget: input.dailyProteinTarget,
    },
    select: {
      dailyCaloriesTarget: true,
      dailyProteinTarget: true,
    },
  });

  return toUserPreference(preference);
}
