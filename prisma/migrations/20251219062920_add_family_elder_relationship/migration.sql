-- AlterTable
ALTER TABLE "users" ADD COLUMN     "assigned_family_id" TEXT;

-- CreateIndex
CREATE INDEX "users_assigned_family_id_idx" ON "users"("assigned_family_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_assigned_family_id_fkey" FOREIGN KEY ("assigned_family_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
