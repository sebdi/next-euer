-- CreateTable
CREATE TABLE "transactions" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "account" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "incomeCents" BIGINT NOT NULL DEFAULT 0,
    "expenseCents" BIGINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_amounts_xor_check"
CHECK (
    ("incomeCents" >= 0 AND "expenseCents" >= 0)
    AND (
        ("incomeCents" > 0 AND "expenseCents" = 0)
        OR ("expenseCents" > 0 AND "incomeCents" = 0)
    )
);

-- CreateIndex
CREATE INDEX "transactions_date_idx" ON "transactions"("date");

-- CreateIndex
CREATE INDEX "transactions_category_idx" ON "transactions"("category");

-- CreateIndex
CREATE INDEX "transactions_date_category_idx" ON "transactions"("date", "category");
