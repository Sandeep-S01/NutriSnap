import { NextRequest, NextResponse } from "next/server";

export async function readJsonBody(request: NextRequest) {
  try {
    return {
      success: true,
      data: (await request.json()) as unknown,
    } as const;
  } catch {
    return {
      success: false,
      response: NextResponse.json(
        {
          status: "error",
          message: "Request body must be valid JSON.",
        },
        { status: 400 },
      ),
    } as const;
  }
}
