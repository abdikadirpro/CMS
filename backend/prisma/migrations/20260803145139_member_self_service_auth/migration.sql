-- AlterEnum
ALTER TYPE "ActorType" ADD VALUE 'MEMBER';

-- AlterEnum
ALTER TYPE "MemberStatus" ADD VALUE 'PROBATIONARY';

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3),
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "probationStartedAt" TIMESTAMP(3),
ADD COLUMN     "resetTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "resetTokenHash" TEXT;

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "memberId" TEXT;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
