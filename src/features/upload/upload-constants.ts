export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_SERVER_UPLOAD_SIZE_BYTES = 4 * 1024 * 1024;
export const CLIENT_IMAGE_COMPRESSION_MAX_MB = 3.5;
export const CLIENT_IMAGE_COMPRESSION_MAX_DIMENSION = 1800;

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const ACCEPTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
