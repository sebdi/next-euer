-- AlterTable
ALTER TABLE "transactions"
ADD COLUMN "routeOrigin" TEXT,
ADD COLUMN "routeDestination" TEXT,
ADD COLUMN "distanceMeters" INTEGER,
ADD COLUMN "rateCentsPerKm" INTEGER;
