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

function isUploadBody(body: unknown): body is HandleUploadBody {
  if (!body || typeof body !== "object" || !("type" in body)) {
    return false;
  }

  const type = (body as { type: unknown }).type;

  return (
    type === "blob.generate-client-token" ||
    type === "blob.upload-completed"
  );
}

function isValidUploadPathname(pathname: string) {
  return (
    pathname.startsWith("food-images/") &&
    !pathname.includes("..") &&
    !pathname.includes("\\")
  );
}

export async function POST(request: NextRequest) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

  if (!blobToken?.startsWith("vercel_blob_rw_")) {
    appLogger.error("Blob upload token is missing or invalid", new Error("Invalid Blob token"), {
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
    const body = await request.json();

    if (!isUploadBody(body)) {
      return NextResponse.json(
        {
          status: "error",
          message: "Invalid upload request.",
        },
        { status: 400 },
      );
    }

    const response = await handleUpload({
      request,
      body,
      token: blobToken,
      onBeforeGenerateToken: async (pathname) => {
        const { userId } = await auth();

        if (!userId) {
          throw new Error("Unauthorized upload token request.");
        }

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
    appLogger.error("Blob client upload request failed", error);

    return NextResponse.json(
      {
        status: "error",
        message: "Unable to prepare image upload. Please try again.",
      },
      { status: 500 },
    );
  }
}
