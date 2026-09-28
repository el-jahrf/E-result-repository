/*
  Safe migration for the school result structure.

  Existing classes:
  JSS1, JSS2, JSS3 -> JSS
  SS1, SS2, SS3     -> SS

  Existing Result.caScore values are preserved by moving them to ca1Score.
*/

-- CreateEnum
CREATE TYPE "SchoolSection" AS ENUM ('NURSERY', 'PRIMARY', 'JSS', 'SS');

-- Add section temporarily as nullable
ALTER TABLE "Class"
ADD COLUMN "section" "SchoolSection";

-- Assign sections to existing classes
UPDATE "Class"
SET "section" = 'JSS'
WHERE UPPER("name") IN ('JSS1', 'JSS 1', 'JSS-1', 'JSS2', 'JSS 2', 'JSS-2', 'JSS3', 'JSS 3', 'JSS-3')
   OR UPPER("level") IN ('JSS1', 'JSS 1', 'JSS-1', 'JSS2', 'JSS 2', 'JSS-2', 'JSS3', 'JSS 3', 'JSS-3');

UPDATE "Class"
SET "section" = 'SS'
WHERE UPPER("name") IN ('SS1', 'SS 1', 'SS-1', 'SS2', 'SS 2', 'SS-2', 'SS3', 'SS 3', 'SS-3')
   OR UPPER("level") IN ('SS1', 'SS 1', 'SS-1', 'SS2', 'SS 2', 'SS-2', 'SS3', 'SS 3', 'SS-3');

-- Make section required now that existing classes have values
ALTER TABLE "Class"
ALTER COLUMN "section" SET NOT NULL;

-- Enrollment attendance fields
ALTER TABLE "Enrollment"
ADD COLUMN "attendanceAbsent" INTEGER,
ADD COLUMN "attendanceOpened" INTEGER,
ADD COLUMN "attendancePercentage" DECIMAL(5,2),
ADD COLUMN "attendancePresent" INTEGER;

-- Add the new CA fields while preserving existing CA data
ALTER TABLE "Result"
ADD COLUMN "ca1Score" DECIMAL(5,2),
ADD COLUMN "ca2Score" DECIMAL(5,2),
ADD COLUMN "caTotal" DECIMAL(5,2);

-- Preserve existing CA scores as CA1
UPDATE "Result"
SET "ca1Score" = "caScore";

-- Existing exam/total values remain intact
ALTER TABLE "Result"
ALTER COLUMN "examScore" DROP NOT NULL,
ALTER COLUMN "totalScore" DROP NOT NULL;

-- Remove the old CA field only after its data has been copied
ALTER TABLE "Result"
DROP COLUMN "caScore";

-- Add section to subjects
ALTER TABLE "Subject"
ADD COLUMN "section" "SchoolSection";

-- Term summary
CREATE TABLE "TermSummary" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "overallTotal" DECIMAL(7,2),
    "average" DECIMAL(5,2),
    "position" INTEGER,
    "positionOutOf" INTEGER,
    "performanceRate" DECIMAL(5,2),
    "classScoringAverage" DECIMAL(5,2),
    "teacherComment" TEXT,
    "headTeacherComment" TEXT,
    "parentComment" TEXT,
    "teacherSignedAt" TIMESTAMP(3),
    "headTeacherSignedAt" TIMESTAMP(3),
    "parentSignedAt" TIMESTAMP(3),
    "nextTermDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TermSummary_pkey" PRIMARY KEY ("id")
);

-- Affective / behavioural ratings
CREATE TABLE "AffectiveRatingRecord" (
    "id" TEXT NOT NULL,
    "termSummaryId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AffectiveRatingRecord_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "TermSummary_enrollmentId_key"
ON "TermSummary"("enrollmentId");

CREATE INDEX "AffectiveRatingRecord_termSummaryId_idx"
ON "AffectiveRatingRecord"("termSummaryId");

CREATE UNIQUE INDEX "AffectiveRatingRecord_termSummaryId_item_key"
ON "AffectiveRatingRecord"("termSummaryId", "item");

CREATE INDEX "Class_section_level_idx"
ON "Class"("section", "level");

CREATE INDEX "Subject_section_idx"
ON "Subject"("section");

-- Foreign keys
ALTER TABLE "TermSummary"
ADD CONSTRAINT "TermSummary_enrollmentId_fkey"
FOREIGN KEY ("enrollmentId")
REFERENCES "Enrollment"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "AffectiveRatingRecord"
ADD CONSTRAINT "AffectiveRatingRecord_termSummaryId_fkey"
FOREIGN KEY ("termSummaryId")
REFERENCES "TermSummary"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;