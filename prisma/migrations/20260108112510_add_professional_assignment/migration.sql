-- AlterTable
ALTER TABLE "users" ADD COLUMN     "assigned_professional_id" TEXT;

-- CreateIndex
CREATE INDEX "users_assigned_professional_id_idx" ON "users"("assigned_professional_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_assigned_professional_id_fkey" FOREIGN KEY ("assigned_professional_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
