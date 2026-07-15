/**
 * One-off data migration: renames the 11 placeholder zones to their real Somali Region
 * (Ethiopia) names and replaces each zone's placeholder districts with the real district list.
 * Existing admins assigned to old districts are reassigned (round-robin) to the new districts
 * instead of being silently orphaned; existing complaints keep their zoneId (districtId is
 * cleared since the old district no longer exists under the new naming).
 *
 * Run once: node scripts/migrate-real-districts.js
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// The user had already manually renamed all 11 zones (in their own order/spelling) before
// requesting this migration, so we match by zone ID — captured from the live `/api/zones`
// response — rather than by the original placeholder "Zone N" names.
const DATA = [
  { zoneId: "e1749ea4-d37d-4016-8416-b70a6c6853ec", currentName: "Faafan Zone (edited)", newZoneName: "Gobolka Faafan", districts: ["Jigjiga", "Awbare", "Gursum", "Harshin", "Tuli Guuleed", "Babille", "Kebri Beyah", "Wajaale", "Qooraan", "Goljano", "Harooreys", "Shabeeley"] },
  { zoneId: "a5c64fd4-a1a8-4b11-b0ca-5bf00cce6058", currentName: "sitti zone", newZoneName: "Gobolka Siti", districts: ["Shinile", "Erer", "Afdem", "Aysha", "Dambal", "Mieso", "Adigala", "Bike", "Gablalu", "Dhunyar", "Daymeed"] },
  { zoneId: "646a608e-2ac5-451a-b5be-cba7fd04f8a9", currentName: "Jarar Zone", newZoneName: "Gobolka Jarar", districts: ["Degehabur", "Birqod", "Awaare", "Daroor", "Dig", "Gunagado", "Yoocaale", "Dhagaxmadow", "Bilcil Buur", "Araarso", "Misraq Gashamo"] },
  { zoneId: "54fcb429-511f-45b6-83d8-def2a94ff556", currentName: "Erer Zone ", newZoneName: "Gobolka Erer", districts: ["Fiiq", "Lagahida", "Qubi", "Salahad", "Xamaro", "Yaxoob", "Waangaay", "Maya Muluqo"] },
  { zoneId: "75d9153a-e359-469f-9420-90778e4c0cac", currentName: "Nogob Zone", newZoneName: "Gobolka Nogob", districts: ["Aayuun", "Dhuun", "Gerbo", "Xaraarey", "Hora-shagax", "Segeg", "Ceelwayne"] },
  { zoneId: "d0644eea-f4d7-4386-8a85-058dfdc1d19f", currentName: "Doolo Zone", newZoneName: "Gobolka Doolo", districts: ["Wardheer", "Danot", "Boh", "Daratole", "Geladiin", "Galxamur", "Lehel Yucub", "Yamarugley", "Urmadag"] },
  { zoneId: "33446741-bb0d-4253-87c8-f1c77704b424", currentName: "Qoraxey Zone", newZoneName: "Gobolka Qorahay", districts: ["Kebri Dahar", "Shekosh", "Shilaabo", "Marsin", "Dobawein", "Ceel Ogaadeen", "Laas Dhankayre", "Kudunbuur", "Higlooley", "Boodaley"] },
  { zoneId: "8a563f63-ff54-4437-a933-d2e306de2720", currentName: "Shabeele Zone", newZoneName: "Gobolka Shabeelle", districts: ["Godey", "Kelafo", "Mustaxiil", "Ferfer", "Adadle", "Danan", "Imi Bari", "Abaaqorow", "Beercaano", "Eleele"] },
  { zoneId: "ba18d5bc-a6aa-421d-9f54-f6e7a5be161d", currentName: "fiiq zone", newZoneName: "Gobolka Afdheer", districts: ["Hargelle", "Barey", "Doolo Bay", "Ceelkere", "Mirab Imi", "Raaso", "Qooxle", "Godgod", "Ilig Dheere", "Washaaqo", "Xagar Moqor", "Ciid Laami"] },
  { zoneId: "49b3b7e9-a906-4c9b-96ac-f6ea286c7ee8", currentName: "Liiban Zone ", newZoneName: "Gobolka Liban", districts: ["Filtu", "Doolo Ado", "Bokolmayo", "Deka Suftu", "Kersa Dula", "Gurra Damole", "Gooro Baqaqsa"] },
  { zoneId: "4f73998d-2ba6-4ac2-8855-979d8fc084da", currentName: "Dawo zone", newZoneName: "Gobolka Daawa", districts: ["Lahey", "Hudet", "Mubaarak", "Qadhaadhumo", "Malka Mari", "Ceel Goof", "Ceel Orba", "Dheer Dheertu", "Ceel Dheer"] },
];

async function main() {
  for (const zoneData of DATA) {
    const zone = await prisma.zone.findUnique({ where: { id: zoneData.zoneId } });
    if (!zone) {
      console.log(`SKIP: zone id "${zoneData.zoneId}" (expected "${zoneData.currentName}") not found`);
      continue;
    }

    await prisma.zone.update({ where: { id: zone.id }, data: { name: zoneData.newZoneName } });
    console.log(`Renamed "${zone.name}" -> "${zoneData.newZoneName}"`);

    const oldDistricts = await prisma.district.findMany({ where: { zoneId: zone.id } });
    const oldDistrictIds = oldDistricts.map((d) => d.id);

    const adminsToReassign = await prisma.admin.findMany({ where: { districtId: { in: oldDistrictIds } } });

    const newDistricts = [];
    for (const name of zoneData.districts) {
      const created = await prisma.district.upsert({
        where: { zoneId_name: { zoneId: zone.id, name } },
        update: {},
        create: { name, zoneId: zone.id },
      });
      newDistricts.push(created);
    }
    console.log(`  Created/verified ${newDistricts.length} real districts`);

    for (let i = 0; i < adminsToReassign.length; i++) {
      const target = newDistricts[i % newDistricts.length];
      await prisma.admin.update({ where: { id: adminsToReassign[i].id }, data: { districtId: target.id } });
    }
    if (adminsToReassign.length > 0) {
      console.log(`  Reassigned ${adminsToReassign.length} admin(s) from old districts to new ones`);
    }

    if (oldDistrictIds.length > 0) {
      await prisma.district.deleteMany({ where: { id: { in: oldDistrictIds } } });
      console.log(`  Removed ${oldDistrictIds.length} old placeholder districts (their complaints keep zoneId, lose districtId)`);
    }
  }

  console.log("\nMigration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
