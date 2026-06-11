CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "dailyCaloriesTarget" DOUBLE PRECISION NOT NULL DEFAULT 2000,
    "dailyProteinTarget" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPreference_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPreference_clerkUserId_key" ON "UserPreference"("clerkUserId");
