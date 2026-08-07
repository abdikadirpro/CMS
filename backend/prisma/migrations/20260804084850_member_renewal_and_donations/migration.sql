-- CreateEnum
CREATE TYPE "DonationStatus" AS ENUM ('PENDING', 'CONFIRMED');

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "membershipExpiresAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "donorName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "note" TEXT,
    "receiptPath" TEXT,
    "status" "DonationStatus" NOT NULL DEFAULT 'PENDING',
    "zoneId" TEXT,
    "districtId" TEXT,
    "townAdministrationId" TEXT,
    "officeId" TEXT,
    "partyBranchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_townAdministrationId_fkey" FOREIGN KEY ("townAdministrationId") REFERENCES "town_administrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_partyBranchId_fkey" FOREIGN KEY ("partyBranchId") REFERENCES "party_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
