/*
  Warnings:

  - The `needs_financial_assistance` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `needs_legal_support` column on the `users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "needs_financial_assistance",
ADD COLUMN     "needs_financial_assistance" BOOLEAN,
DROP COLUMN "needs_legal_support",
ADD COLUMN     "needs_legal_support" BOOLEAN;
