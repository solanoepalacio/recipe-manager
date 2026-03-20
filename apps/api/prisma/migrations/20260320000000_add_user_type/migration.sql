-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('normal', 'kid', 'agent');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "userType" "UserType" NOT NULL DEFAULT 'normal',
ALTER COLUMN "gender" DROP NOT NULL,
ALTER COLUMN "dateOfBirth" DROP NOT NULL;
