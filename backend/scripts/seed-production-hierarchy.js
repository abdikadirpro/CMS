/**
 * Adds the real Somali Region zone/district hierarchy to production — same data used to migrate
 * the local dev database. Safe to re-run: uses upsert, so it won't duplicate existing records.
 *
 * Run with: DATABASE_URL="<production external URL>" node scripts/seed-production-hierarchy.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const DATA = [
  { name: "Gobolka Faafan", districts: ["Jigjiga", "Awbare", "Gursum", "Harshin", "Tuli Guuleed", "Babille", "Kebri Beyah", "Wajaale", "Qooraan", "Goljano", "Harooreys", "Shabeeley"] },
  { name: "Gobolka Siti", districts: ["Shinile", "Erer", "Afdem", "Aysha", "Dambal", "Mieso", "Adigala", "Bike", "Gablalu", "Dhunyar", "Daymeed"] },
  { name: "Gobolka Jarar", districts: ["Degehabur", "Birqod", "Awaare", "Daroor", "Dig", "Gunagado", "Yoocaale", "Dhagaxmadow", "Bilcil Buur", "Araarso", "Misraq Gashamo"] },
  { name: "Gobolka Erer", districts: ["Fiiq", "Lagahida", "Qubi", "Salahad", "Xamaro", "Yaxoob", "Waangaay", "Maya Muluqo"] },
  { name: "Gobolka Nogob", districts: ["Aayuun", "Dhuun", "Gerbo", "Xaraarey", "Hora-shagax", "Segeg", "Ceelwayne"] },
  { name: "Gobolka Doolo", districts: ["Wardheer", "Danot", "Boh", "Daratole", "Geladiin", "Galxamur", "Lehel Yucub", "Yamarugley", "Urmadag"] },
  { name: "Gobolka Qorahay", districts: ["Kebri Dahar", "Shekosh", "Shilaabo", "Marsin", "Dobawein", "Ceel Ogaadeen", "Laas Dhankayre", "Kudunbuur", "Higlooley", "Boodaley"] },
  { name: "Gobolka Shabeelle", districts: ["Godey", "Kelafo", "Mustaxiil", "Ferfer", "Adadle", "Danan", "Imi Bari", "Abaaqorow", "Beercaano", "Eleele"] },
  { name: "Gobolka Afdheer", districts: ["Hargelle", "Barey", "Doolo Bay", "Ceelkere", "Mirab Imi", "Raaso", "Qooxle", "Godgod", "Ilig Dheere", "Washaaqo", "Xagar Moqor", "Ciid Laami"] },
  { name: "Gobolka Liban", districts: ["Filtu", "Doolo Ado", "Bokolmayo", "Deka Suftu", "Kersa Dula", "Gurra Damole", "Gooro Baqaqsa"] },
  { name: "Gobolka Daawa", districts: ["Lahey", "Hudet", "Mubaarak", "Qadhaadhumo", "Malka Mari", "Ceel Goof", "Ceel Orba", "Dheer Dheertu", "Ceel Dheer"] },
];

async function main() {
  let zoneCount = 0;
  let districtCount = 0;

  for (const zoneData of DATA) {
    const zone = await prisma.zone.upsert({
      where: { name: zoneData.name },
      update: {},
      create: { name: zoneData.name },
    });
    zoneCount++;
    console.log(`Zone: ${zone.name}`);

    for (const districtName of zoneData.districts) {
      await prisma.district.upsert({
        where: { zoneId_name: { zoneId: zone.id, name: districtName } },
        update: {},
        create: { name: districtName, zoneId: zone.id },
      });
      districtCount++;
    }
    console.log(`  + ${zoneData.districts.length} districts`);
  }

  console.log(`\nDone. ${zoneCount} zones, ${districtCount} districts.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
