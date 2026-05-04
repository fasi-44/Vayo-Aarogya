-- AlterTable: add scale_results JSON column to assessments for storing clinical scale results
ALTER TABLE "assessments" ADD COLUMN "scale_results" JSONB;
