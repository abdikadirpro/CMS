-- CreateEnum
CREATE TYPE "VolunteerStatus" AS ENUM ('NEW', 'CONTACTED', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "volunteers" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "interest" TEXT,
    "status" "VolunteerStatus" NOT NULL DEFAULT 'NEW',
    "zoneId" TEXT,
    "districtId" TEXT,
    "townAdministrationId" TEXT,
    "officeId" TEXT,
    "partyBranchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "volunteers_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_townAdministrationId_fkey" FOREIGN KEY ("townAdministrationId") REFERENCES "town_administrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "volunteers" ADD CONSTRAINT "volunteers_partyBranchId_fkey" FOREIGN KEY ("partyBranchId") REFERENCES "party_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
