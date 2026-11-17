-- Income bookings no longer use an expense category.
ALTER TABLE "transactions" ADD COLUMN "invoiceNumber" TEXT;

UPDATE "transactions" SET "category" = '' WHERE "incomeCents" > 0;
