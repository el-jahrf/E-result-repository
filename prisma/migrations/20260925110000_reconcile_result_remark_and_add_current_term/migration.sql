-- Reconcile the teacherRemark column that already exists in the database.
ALTER TABLE "Result"
ADD COLUMN IF NOT EXISTS "teacherRemark" TEXT;

-- Add the current term setting to each academic session.
ALTER TABLE "AcademicSession"
ADD COLUMN IF NOT EXISTS "currentTerm" "Term" NOT NULL DEFAULT 'FIRST';