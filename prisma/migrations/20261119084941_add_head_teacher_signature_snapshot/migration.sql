-- DropIndex
DROP INDEX "AffectiveRatingRecord_termSummaryId_idx";

-- DropIndex
DROP INDEX "AffectiveRatingRecord_termSummaryId_item_key";

-- AlterTable
ALTER TABLE "TermSummary" ADD COLUMN     "headTeacherSignatureData" TEXT,
ALTER COLUMN "punctualityRating" SET DATA TYPE TEXT;
