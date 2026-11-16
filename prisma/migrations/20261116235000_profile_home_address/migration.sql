-- CreateTable
CREATE TABLE "profiles" (
    "githubId" TEXT NOT NULL,
    "homeAddress" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("githubId")
);
