const { customAlphabet } = require("nanoid");

const nanoid = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

function generateTrackingId() {
  const year = new Date().getFullYear();
  return `CMS-${year}-${nanoid()}`;
}

module.exports = { generateTrackingId };
