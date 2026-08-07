-- AlterEnum
ALTER TYPE "ActorType" ADD VALUE 'PARTY_ADMIN';

-- DropForeignKey
ALTER TABLE "members" DROP CONSTRAINT "members_reviewedById_fkey";

-- AlterTable
ALTER TABLE "refresh_tokens" ADD COLUMN     "partyAdminId" TEXT;

-- CreateTable
CREATE TABLE "party_admins" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "resetTokenHash" TEXT,
    "resetTokenExpiresAt" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "party_admins_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "party_admins_email_key" ON "party_admins"("email");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_partyAdminId_fkey" FOREIGN KEY ("partyAdminId") REFERENCES "party_admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "party_admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
