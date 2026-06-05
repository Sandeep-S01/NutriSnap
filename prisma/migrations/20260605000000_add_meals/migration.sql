CREATE TABLE "Meal" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "foodName" TEXT NOT NULL,
    "estimatedWeightGrams" DOUBLE PRECISION NOT NULL,
    "calories" DOUBLE PRECISION NOT NULL,
    "protein" DOUBLE PRECISION NOT NULL,
    "carbs" DOUBLE PRECISION NOT NULL,
    "fat" DOUBLE PRECISION NOT NULL,
    "fiber" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "vitamins" JSONB NOT NULL,
    "aiRawResponse" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meal_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Meal_clerkUserId_createdAt_idx" ON "Meal"("clerkUserId", "createdAt");
