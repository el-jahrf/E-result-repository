/*
  Warnings:

  - A unique constraint covering the columns `[termSummaryId,item]` on the table `AffectiveRatingRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "AcademicSession" ADD COLUMN     "firstTermResumptionDate" TIMESTAMP(3),
ADD COLUMN     "secondTermResumptionDate" TIMESTAMP(3),
ADD COLUMN     "thirdTermResumptionDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AffectiveRatingRecord_termSummaryId_idx" ON "AffectiveRatingRecord"("termSummaryId");

-- CreateIndex
CREATE UNIQUE INDEX "AffectiveRatingRecord_termSummaryId_item_key" ON "AffectiveRatingRecord"("termSummaryId", "item");
