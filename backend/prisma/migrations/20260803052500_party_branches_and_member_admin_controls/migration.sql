-- AlterTable
ALTER TABLE "members" ADD COLUMN     "partyBranchId" TEXT;

-- CreateTable
CREATE TABLE "party_branches" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "party_branches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "party_branches_name_key" ON "party_branches"("name");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_partyBranchId_fkey" FOREIGN KEY ("partyBranchId") REFERENCES "party_branches"("id") ON DELETE SET NULL ON UPDATE CASCADE;
