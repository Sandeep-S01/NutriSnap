import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  mealIdSchema,
  updateMealSchema,
} from "@/features/meals/meal-validation";
import { readJsonBody } from "@/server/api";
import { appLogger } from "@/server/logger";
import { deleteMeal, updateMeal } from "@/server/meals";
import {
  checkRateLimit,
  getRateLimitKey,
  rateLimitedResponse,
} from "@/server/rate-limit";

type MealRouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: MealRouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const rateLimit = checkRateLimit({
      key: getRateLimitKey(request, "meals:update", userId),
      limit: 30,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.resetAt);
    }

    const params = await context.params;
    const parsedParams = mealIdSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json(
        { status: "error", message: "Invalid meal id." },
        { status: 400 },
      );
    }

    const body = await readJsonBody(request);

    if (!body.success) {
      return body.response;
    }

    const parsedBody = updateMealSchema.safeParse(body.data);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid meal update payload.",
          issues: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const meal = await updateMeal(userId, parsedParams.data.id, parsedBody.data);

    if (!meal) {
      return NextResponse.json(
        { status: "error", message: "Meal not found." },
        { status: 404 },
      );
    }

    appLogger.info("Meal updated", { userId, mealId: meal.id });

    return NextResponse.json({
      status: "success",
      message: "Meal updated successfully.",
      meal,
    });
  } catch (error) {
    appLogger.error("Update meal API failed", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Unable to update meal. Please try again.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: MealRouteContext) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const rateLimit = checkRateLimit({
      key: getRateLimitKey(request, "meals:delete", userId),
      limit: 30,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.resetAt);
    }

    const params = await context.params;
    const parsedParams = mealIdSchema.safeParse(params);

    if (!parsedParams.success) {
      return NextResponse.json(
        { status: "error", message: "Invalid meal id." },
        { status: 400 },
      );
    }

    const meal = await deleteMeal(userId, parsedParams.data.id);

    if (!meal) {
      return NextResponse.json(
        { status: "error", message: "Meal not found." },
        { status: 404 },
      );
    }

    appLogger.info("Meal deleted", { userId, mealId: meal.id });

    return NextResponse.json({
      status: "success",
      message: "Meal deleted successfully.",
      meal,
    });
  } catch (error) {
    appLogger.error("Delete meal API failed", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Unable to delete meal. Please try again.",
      },
      { status: 500 },
    );
  }
}
