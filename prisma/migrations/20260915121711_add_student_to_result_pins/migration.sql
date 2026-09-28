/*
  Warnings:

  - Added the required column `studentId` to the `ResultPin` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_role_idx";

-- AlterTable
ALTER TABLE "ResultPin" ADD COLUMN     "studentId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "ResultPin_studentId_sessionId_term_idx" ON "ResultPin"("studentId", "sessionId", "term");

-- AddForeignKey
ALTER TABLE "ResultPin" ADD CONSTRAINT "ResultPin_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
