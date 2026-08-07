const { customAlphabet } = require("nanoid");
const prisma = require("../config/db");

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);
const SIX_MONTHS_MS = 6 * 30 * 24 * 60 * 60 * 1000;

function generateMembershipNumber() {
  const year = new Date().getFullYear();
  return `XB-${year}-${nanoid()}`;
}

async function createUniqueMembershipNumber() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const membershipNumber = generateMembershipNumber();
    const existing = await prisma.member.findUnique({ where: { membershipNumber } });
    if (!existing) return membershipNumber;
  }
  throw new Error("Failed to generate a unique membership number, please retry");
}

/**
 * A probationary member becomes eligible for full membership 6 months after their application
 * was approved (probationStartedAt), not from their original registration date. A member who
 * hasn't been approved into probation yet (still PENDING) has no probation clock running.
 */
function isEligibleForApproval(member) {
  if (!member.probationStartedAt) return false;
  return Date.now() - new Date(member.probationStartedAt).getTime() >= SIX_MONTHS_MS;
}

function getEligibleAt(member) {
  if (!member.probationStartedAt) return null;
  return new Date(new Date(member.probationStartedAt).getTime() + SIX_MONTHS_MS);
}

module.exports = { createUniqueMembershipNumber, isEligibleForApproval, getEligibleAt };
