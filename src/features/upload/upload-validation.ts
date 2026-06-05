import { z } from "zod";
import {
  ACCEPTED_IMAGE_EXTENSIONS,
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_SIZE_BYTES,
} from "./upload-constants";

export const foodImageFileSchema = z
  .instanceof(File)
  .refine((file) => file.size > 0, "Select an image to upload.")
  .refine(
    (file) => file.size <= MAX_UPLOAD_SIZE_BYTES,
    "Image must be 10MB or smaller.",
  )
  .refine(
    (file) =>
      ACCEPTED_IMAGE_TYPES.includes(
        file.type as (typeof ACCEPTED_IMAGE_TYPES)[number],
      ),
    `Image must be ${ACCEPTED_IMAGE_EXTENSIONS.join(", ")}.`,
  );

export function validateFoodImageFile(file: File) {
  const result = foodImageFileSchema.safeParse(file);

  if (!result.success) {
    return {
      success: false as const,
      error: result.error.issues[0]?.message ?? "Invalid image.",
    };
  }

  return {
    success: true as const,
    data: result.data,
  };
}
