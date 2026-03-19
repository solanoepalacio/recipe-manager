-- Backfill existing NULL values with defaults before making columns NOT NULL
UPDATE "User" SET "gender" = 'other' WHERE "gender" IS NULL;
UPDATE "User" SET "dateOfBirth" = '2000-01-01' WHERE "dateOfBirth" IS NULL;

-- AlterTable: make gender and dateOfBirth required (NOT NULL)
ALTER TABLE "User" ALTER COLUMN "gender" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "dateOfBirth" SET NOT NULL;
