export type UploadedFoodImage = {
  url: string;
  pathname: string;
  contentType: string;
  contentDisposition: string;
  uploadedAt: string;
};

export type UploadFoodImageState = {
  status: "idle" | "success" | "error";
  message?: string;
  image?: UploadedFoodImage;
};
