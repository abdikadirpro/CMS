/*
  Warnings:

  - Added the required column `partyAdminType` to the `party_admins` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PartyAdminType" AS ENUM ('PARTY_SUPER_ADMIN', 'PARTY_ZONE_ADMIN', 'PARTY_TOWN_ADMIN', 'PARTY_DISTRICT_ADMIN', 'PARTY_OFFICE_ADMIN');

-- AlterTable
ALTER TABLE "party_admins" ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "officeId" TEXT,
ADD COLUMN     "partyAdminType" "PartyAdminType" NOT NULL,
ADD COLUMN     "townAdministrationId" TEXT,
ADD COLUMN     "zoneId" TEXT;

-- AddForeignKey
ALTER TABLE "party_admins" ADD CONSTRAINT "party_admins_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_admins" ADD CONSTRAINT "party_admins_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_admins" ADD CONSTRAINT "party_admins_townAdministrationId_fkey" FOREIGN KEY ("townAdministrationId") REFERENCES "town_administrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "party_admins" ADD CONSTRAINT "party_admins_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "offices"("id") ON DELETE SET NULL ON UPDATE CASCADE;
