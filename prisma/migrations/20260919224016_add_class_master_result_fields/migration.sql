-- AlterTable
ALTER TABLE "TermSummary" ADD COLUMN     "classTeacherComment" TEXT,
ADD COLUMN     "classTeacherSignatureData" TEXT,
ADD COLUMN     "classTeacherSignedAt" TIMESTAMP(3),
ADD COLUMN     "punctualityRating" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profileCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ClassMasterAssignment" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClassMasterAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ClassMasterAssignment_teacherId_sessionId_idx" ON "ClassMasterAssignment"("teacherId", "sessionId");

-- CreateIndex
CREATE INDEX "ClassMasterAssignment_classId_sessionId_idx" ON "ClassMasterAssignment"("classId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassMasterAssignment_teacherId_classId_sessionId_key" ON "ClassMasterAssignment"("teacherId", "classId", "sessionId");

-- AddForeignKey
ALTER TABLE "ClassMasterAssignment" ADD CONSTRAINT "ClassMasterAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMasterAssignment" ADD CONSTRAINT "ClassMasterAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassMasterAssignment" ADD CONSTRAINT "ClassMasterAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
