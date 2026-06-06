"use server";

import { put } from "@vercel/blob";
import { randomUUID } from "crypto";
import { z } from "zod";
import { requireCurrentUser } from "@/actions/auth";
import { validateFoodImageFile } from "@/features/upload/upload-validation";
import { appLogger } from "@/server/logger";
import { checkRateLimit } from "@/server/rate-limit";
import type { UploadFoodImageState } from "@/types/upload";

const uploadFormSchema = z.object({
  image: z.instanceof(File, { message: "Image file is required." }),
});

function getUploadErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "Unable to upload image. Please try again.";
  }

  const message = error.message.toLowerCase();

  if (message.includes("token")) {
    return "Image storage is not configured correctly.";
  }

  if (message.includes("body exceeded") || message.includes("413")) {
    return "Image upload is too large. Choose a smaller image and try again.";
  }

  if (message.includes("blob")) {
    return "Image storage failed. Please try again.";
  }

  return "Unable to upload image. Please try again.";
}

function getSafeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function uploadFoodImage(
  _previousState: UploadFoodImageState,
  formData: FormData,
): Promise<UploadFoodImageState> {
  try {
    const user = await requireCurrentUser();
    const rateLimit = checkRateLimit({
      key: `upload:${user.id}`,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return {
        status: "error",
        message: "Too many uploads. Please wait a moment and try again.",
      };
    }

    const parsedForm = uploadFormSchema.safeParse({
      image: formData.get("image"),
    });

    if (!parsedForm.success) {
      return {
        status: "error",
        message:
          parsedForm.error.issues[0]?.message ?? "Image file is required.",
      };
    }

    const validation = validateFoodImageFile(parsedForm.data.image);

    if (!validation.success) {
      return {
        status: "error",
        message: validation.error,
      };
    }

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return {
        status: "error",
        message: "Image storage is not configured correctly.",
      };
    }

    const image = validation.data;
    const safeFileName = getSafeFileName(image.name) || "food-image";
    const pathname = `users/${user.id}/food-images/${randomUUID()}-${safeFileName}`;
    const blob = await put(pathname, image, {
      access: "public",
      contentType: image.type,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });

    appLogger.info("Food image uploaded", {
      userId: user.id,
      contentType: image.type,
      size: image.size,
    });

    return {
      status: "success",
      message: "Image uploaded successfully.",
      image: {
        url: blob.url,
        pathname: blob.pathname,
        contentType: blob.contentType,
        contentDisposition: blob.contentDisposition,
        uploadedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    appLogger.error("Food image upload failed", error);

    return {
      status: "error",
      message: getUploadErrorMessage(error),
    };
  }
}
