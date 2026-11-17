-- Several businesses, each with its own EÜR (e.g. freiberuflich and gewerblich).
CREATE TABLE "businesses" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "businesses_kind_check" CHECK ("kind" IN ('freiberuflich', 'gewerblich'))
);

-- Existing bookings move into one default business.
INSERT INTO "businesses" ("id", "name", "kind", "updatedAt")
VALUES (gen_random_uuid(), 'Mein Betrieb', 'freiberuflich', CURRENT_TIMESTAMP);

ALTER TABLE "transactions" ADD COLUMN "businessId" UUID;

UPDATE "transactions"
SET "businessId" = (SELECT "id" FROM "businesses" ORDER BY "createdAt" LIMIT 1);

ALTER TABLE "transactions" ALTER COLUMN "businessId" SET NOT NULL;

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_businessId_fkey"
FOREIGN KEY ("businessId") REFERENCES "businesses"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "transactions_businessId_date_idx" ON "transactions"("businessId", "date");
