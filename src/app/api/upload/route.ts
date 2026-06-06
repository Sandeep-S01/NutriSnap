import { auth } from "@clerk/nextjs/server";
import { handleUpload } from "@vercel/blob/client";
import type { HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/features/upload/upload-constants";
import { appLogger } from "@/server/logger";

export const runtime = "nodejs";

function isValidUploadPathname(pathname: string) {
  return (
    pathname.startsWith("food-images/") &&
    !pathname.includes("..") &&
    !pathname.includes("\\")
  );
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { status: "error", message: "Unauthorized" },
      { status: 401 },
    );
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!blobToken?.startsWith("vercel_blob_rw_")) {
    appLogger.error("Blob upload token is missing or invalid", new Error("Invalid Blob token"), {
      userId,
      hasToken: Boolean(blobToken),
    });

    return NextResponse.json(
      {
        status: "error",
        message: "Image storage is not configured correctly.",
      },
      { status: 500 },
    );
  }

  try {
    const body = (await request.json()) as HandleUploadBody;
    const response = await handleUpload({
      request,
      body,
      token: blobToken,
      onBeforeGenerateToken: async (pathname) => {
        if (!isValidUploadPathname(pathname)) {
          throw new Error("Invalid upload pathname.");
        }

        return {
          allowedContentTypes: [...ACCEPTED_IMAGE_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_SIZE_BYTES,
          addRandomSuffix: false,
          tokenPayload: JSON.stringify({ userId }),
        };
      },
    });

    return NextResponse.json(response);
  } catch (error) {
    appLogger.error("Blob client upload token request failed", error, { userId });

    return NextResponse.json(
      {
        status: "error",
        message: "Unable to prepare image upload. Please try again.",
      },
      { status: 500 },
    );
  }
}
