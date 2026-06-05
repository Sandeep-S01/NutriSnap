import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createMealSchema } from "@/features/meals/meal-validation";
import { readJsonBody } from "@/server/api";
import { appLogger } from "@/server/logger";
import { createMeal } from "@/server/meals";
import {
  checkRateLimit,
  getRateLimitKey,
  rateLimitedResponse,
} from "@/server/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const rateLimit = checkRateLimit({
      key: getRateLimitKey(request, "meals:create", userId),
      limit: 30,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.resetAt);
    }

    const body = await readJsonBody(request);

    if (!body.success) {
      return body.response;
    }

    const parsedBody = createMealSchema.safeParse(body.data);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid meal payload.",
          issues: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const meal = await createMeal(userId, parsedBody.data);

    appLogger.info("Meal saved", {
      userId,
      mealId: meal.id,
    });

    return NextResponse.json(
      {
        status: "success",
        message: "Meal saved successfully.",
        meal,
      },
      { status: 201 },
    );
  } catch (error) {
    appLogger.error("Create meal API failed", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Unable to save meal. Please try again.",
      },
      { status: 500 },
    );
  }
}
