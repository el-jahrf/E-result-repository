-- AlterTable
ALTER TABLE "Result" ADD COLUMN     "lowestInClass" DECIMAL(5,2),
ADD COLUMN     "teacherSignatureSnapshotUrl" TEXT;

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "signatureUrl" TEXT;

-- CreateIndex
CREATE INDEX "TeacherAssignment_teacherId_sessionId_term_idx" ON "TeacherAssignment"("teacherId", "sessionId", "term");

-- AddForeignKey
ALTER TABLE "TeacherAssignment" ADD CONSTRAINT "TeacherAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
