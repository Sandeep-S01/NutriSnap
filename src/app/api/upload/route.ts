import { auth } from "@clerk/nextjs/server";
import { put } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_SERVER_UPLOAD_SIZE_BYTES,
  MAX_UPLOAD_SIZE_BYTES,
} from "@/features/upload/upload-constants";
import { appLogger } from "@/server/logger";
import type { UploadFoodImageState } from "@/types/upload";

export const runtime = "nodejs";

function isAcceptedImageType(contentType: string) {
  return ACCEPTED_IMAGE_TYPES.includes(
    contentType as (typeof ACCEPTED_IMAGE_TYPES)[number],
  );
}

function getSafeFileName(fileName: string) {
  return (
    fileName
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "food-image.jpg"
  );
}

function errorResponse(message: string, status: number) {
  return NextResponse.json(
    {
      status: "error",
      message,
    } satisfies UploadFoodImageState,
    { status },
  );
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("Your session expired. Please sign in again.", 401);
  }

  const blobToken = process.env.NUTRISNAP_BLOB_READ_WRITE_TOKEN;

  if (!blobToken?.startsWith("vercel_blob_rw_")) {
    appLogger.error(
      "Blob upload token is missing or invalid",
      new Error("Invalid Blob token"),
      { userId, hasToken: Boolean(blobToken) },
    );

    return errorResponse("Image storage is not configured correctly.", 500);
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return errorResponse("Select an image to upload.", 400);
    }

    if (!isAcceptedImageType(image.type)) {
      return errorResponse("Only JPG, PNG, and WebP images are supported.", 400);
    }

    if (image.size > MAX_UPLOAD_SIZE_BYTES) {
      return errorResponse("Image must be 10MB or smaller.", 400);
    }

    if (image.size > MAX_SERVER_UPLOAD_SIZE_BYTES) {
      return errorResponse(
        "Image is still too large after compression. Choose a smaller image and try again.",
        413,
      );
    }

    const safeFileName = getSafeFileName(image.name);
    const pathname = `food-images/${userId}/${crypto.randomUUID()}-${safeFileName}`;

    const blob = await put(pathname, image, {
      access: "public",
      addRandomSuffix: false,
      contentType: image.type,
      token: blobToken,
    });

    appLogger.info("Food image uploaded", {
      userId,
      pathname: blob.pathname,
      size: image.size,
      contentType: image.type,
    });

    return NextResponse.json({
      status: "success",
      message: "Image uploaded successfully.",
      image: {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        contentDisposition: blob.contentDisposition,
        uploadedAt: new Date().toISOString(),
      },
    } satisfies UploadFoodImageState);
  } catch (error) {
    appLogger.error("Food image upload failed", error, { userId });

    return errorResponse("Unable to upload image. Please try again.", 500);
  }
}
