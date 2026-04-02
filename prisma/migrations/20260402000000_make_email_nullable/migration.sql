-- AlterTable: make email nullable and remove phone unique constraint
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "email" DROP DEFAULT;

-- Drop unique constraint on phone if it exists (for multi-profile login)
DROP INDEX IF EXISTS "users_phone_key";
DROP INDEX IF EXISTS "users_phone_role_key";
