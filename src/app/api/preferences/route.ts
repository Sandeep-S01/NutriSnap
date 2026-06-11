import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { updateUserPreferenceSchema } from "@/features/preferences/preference-validation";
import { readJsonBody } from "@/server/api";
import { appLogger } from "@/server/logger";
import { getUserPreference, upsertUserPreference } from "@/server/preferences";
import {
  checkRateLimit,
  getRateLimitKey,
  rateLimitedResponse,
} from "@/server/rate-limit";

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const preference = await getUserPreference(userId);

    return NextResponse.json({
      status: "success",
      preference,
    });
  } catch (error) {
    appLogger.error("Get preferences API failed", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Unable to load nutrition goals. Please try again.",
      },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { status: "error", message: "Unauthorized" },
        { status: 401 },
      );
    }

    const rateLimit = checkRateLimit({
      key: getRateLimitKey(request, "preferences:update", userId),
      limit: 20,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return rateLimitedResponse(rateLimit.resetAt);
    }

    const body = await readJsonBody(request);

    if (!body.success) {
      return body.response;
    }

    const parsedBody = updateUserPreferenceSchema.safeParse(body.data);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid nutrition goals.",
          issues: parsedBody.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const preference = await upsertUserPreference(userId, parsedBody.data);

    appLogger.info("Nutrition goals updated", { userId });

    return NextResponse.json({
      status: "success",
      message: "Nutrition goals updated.",
      preference,
    });
  } catch (error) {
    appLogger.error("Update preferences API failed", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Unable to update nutrition goals. Please try again.",
      },
      { status: 500 },
    );
  }
}
