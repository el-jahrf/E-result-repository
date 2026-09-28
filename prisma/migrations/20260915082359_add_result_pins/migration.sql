-- CreateTable
CREATE TABLE "ResultPin" (
    "id" TEXT NOT NULL,
    "pin" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "term" "Term" NOT NULL,
    "maxUses" INTEGER NOT NULL DEFAULT 5,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultPin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ResultPin_pin_key" ON "ResultPin"("pin");

-- CreateIndex
CREATE INDEX "ResultPin_sessionId_term_idx" ON "ResultPin"("sessionId", "term");

-- CreateIndex
CREATE INDEX "ResultPin_isActive_idx" ON "ResultPin"("isActive");

-- AddForeignKey
ALTER TABLE "ResultPin" ADD CONSTRAINT "ResultPin_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
