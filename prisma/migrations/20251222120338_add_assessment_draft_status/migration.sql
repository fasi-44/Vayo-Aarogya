-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('draft', 'completed');

-- AlterTable
ALTER TABLE "assessments" ADD COLUMN     "current_step" INTEGER,
ADD COLUMN     "status" "AssessmentStatus" NOT NULL DEFAULT 'completed';

-- CreateIndex
CREATE INDEX "assessments_status_idx" ON "assessments"("status");
