const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const DEV_PASSWORD = "Passw0rd!123";

const PERMISSIONS = [
  { code: "complaint.view", description: "View complaints within jurisdiction" },
  { code: "complaint.update_status", description: "Update complaint status" },
  { code: "complaint.assign", description: "Assign complaints to admins" },
  { code: "complaint.transfer", description: "Transfer complaints to another office/admin" },
  { code: "complaint.note", description: "Add notes to complaints" },
  { code: "admin.manage", description: "Create/edit/delete admin accounts" },
  { code: "zone.manage", description: "Manage zones" },
  { code: "district.manage", description: "Manage districts" },
  { code: "town.manage", description: "Manage town administrations" },
  { code: "office.manage", description: "Manage offices" },
  { code: "category.manage", description: "Manage complaint categories" },
  { code: "role.manage", description: "Manage roles and permissions" },
  { code: "activity_log.view", description: "View audit/activity logs" },
  { code: "backup.manage", description: "Create and download system backups" },
];

const CATEGORIES = [
  "Infrastructure", "Corruption", "Public Service Delay", "Security",
  "Health", "Education", "Water Supply", "Environment", "Other",
];

const ZONE_NAMES = Array.from({ length: 11 }, (_, i) => `Zone ${i + 1}`);
const TOWN_ADMIN_NAMES = Array.from({ length: 6 }, (_, i) => `Town Administration ${i + 1}`);
const OFFICE_NAMES = [
  "Ministry of Health", "Ministry of Education", "Water Authority", "Roads Authority",
  "Public Security Office", "Sanitation Department", "Business Licensing Office", "Social Services Office",
];

function distributeDistrictsPerZone(totalDistricts, totalZones) {
  const base = Math.floor(totalDistricts / totalZones);
  const remainder = totalDistricts % totalZones;
  return Array.from({ length: totalZones }, (_, i) => base + (i < remainder ? 1 : 0));
}

async function main() {
  console.time("seed");
  console.log("Hashing dev password...");
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);

  console.log("Seeding permissions...");
  for (const p of PERMISSIONS) {
    await prisma.permission.upsert({ where: { code: p.code }, update: {}, create: p });
  }
  const allPermissions = await prisma.permission.findMany();
  const permCode = (code) => allPermissions.find((p) => p.code === code).id;

  console.log("Seeding roles...");
  const roleDefs = [
    { name: "Super Admin Role", codes: allPermissions.map((p) => p.code) },
    { name: "Zone Admin Role", codes: ["complaint.view", "complaint.update_status", "complaint.assign", "complaint.transfer", "complaint.note", "district.manage", "activity_log.view"] },
    { name: "Town Admin Role", codes: ["complaint.view", "complaint.update_status", "complaint.assign", "complaint.transfer", "complaint.note", "activity_log.view"] },
    { name: "District Admin Role", codes: ["complaint.view", "complaint.update_status", "complaint.assign", "complaint.transfer", "complaint.note"] },
    { name: "Office Admin Role", codes: ["complaint.view", "complaint.update_status", "complaint.transfer", "complaint.note"] },
  ];
  const roles = {};
  for (const def of roleDefs) {
    const role = await prisma.role.upsert({
      where: { name: def.name },
      update: {},
      create: { name: def.name },
    });
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({
      data: def.codes.map((code) => ({ roleId: role.id, permissionId: permCode(code) })),
      skipDuplicates: true,
    });
    roles[def.name] = role;
  }

  console.log("Seeding categories...");
  for (const name of CATEGORIES) {
    await prisma.category.upsert({ where: { name }, update: {}, create: { name } });
  }
  const categories = await prisma.category.findMany();

  console.log("Seeding Super Admins...");
  const loginTable = [];
  for (let i = 1; i <= 2; i++) {
    const email = `superadmin${i}@cms.gov`;
    await prisma.admin.upsert({
      where: { email },
      update: {},
      create: {
        fullName: `Super Admin ${i}`,
        email,
        passwordHash,
        adminType: "SUPER_ADMIN",
        roleId: roles["Super Admin Role"].id,
      },
    });
    loginTable.push({ role: "SUPER_ADMIN", email });
  }

  console.log("Seeding Zones + Zone Admins + Districts + District Admins...");
  const districtCounts = distributeDistrictsPerZone(95, 11);
  let districtCounter = 1;
  for (let zi = 0; zi < ZONE_NAMES.length; zi++) {
    const zone = await prisma.zone.upsert({
      where: { name: ZONE_NAMES[zi] },
      update: {},
      create: { name: ZONE_NAMES[zi] },
    });

    for (let a = 1; a <= 2; a++) {
      const email = `zoneadmin${zi + 1}_${a}@cms.gov`;
      await prisma.admin.upsert({
        where: { email },
        update: {},
        create: {
          fullName: `${zone.name} Admin ${a}`,
          email,
          passwordHash,
          adminType: "ZONE_ADMIN",
          roleId: roles["Zone Admin Role"].id,
          zoneId: zone.id,
        },
      });
      if (zi === 0) loginTable.push({ role: "ZONE_ADMIN", email });
    }

    for (let d = 0; d < districtCounts[zi]; d++) {
      const districtName = `District ${districtCounter}`;
      const district = await prisma.district.upsert({
        where: { zoneId_name: { zoneId: zone.id, name: districtName } },
        update: {},
        create: { name: districtName, zoneId: zone.id },
      });

      for (let a = 1; a <= 2; a++) {
        const email = `districtadmin${districtCounter}_${a}@cms.gov`;
        await prisma.admin.upsert({
          where: { email },
          update: {},
          create: {
            fullName: `${districtName} Admin ${a}`,
            email,
            passwordHash,
            adminType: "DISTRICT_ADMIN",
            roleId: roles["District Admin Role"].id,
            districtId: district.id,
          },
        });
        if (districtCounter === 1) loginTable.push({ role: "DISTRICT_ADMIN", email });
      }
      districtCounter++;
    }
  }

  console.log("Seeding Town Administrations + Admins...");
  for (let ti = 0; ti < TOWN_ADMIN_NAMES.length; ti++) {
    const town = await prisma.townAdministration.upsert({
      where: { name: TOWN_ADMIN_NAMES[ti] },
      update: {},
      create: { name: TOWN_ADMIN_NAMES[ti] },
    });
    for (let a = 1; a <= 2; a++) {
      const email = `townadmin${ti + 1}_${a}@cms.gov`;
      await prisma.admin.upsert({
        where: { email },
        update: {},
        create: {
          fullName: `${town.name} Admin ${a}`,
          email,
          passwordHash,
          adminType: "TOWN_ADMIN",
          roleId: roles["Town Admin Role"].id,
          townAdministrationId: town.id,
        },
      });
      if (ti === 0) loginTable.push({ role: "TOWN_ADMIN", email });
    }
  }

  console.log("Seeding Offices + Office Admins...");
  const offices = [];
  for (let oi = 0; oi < OFFICE_NAMES.length; oi++) {
    let office = await prisma.office.findFirst({ where: { name: OFFICE_NAMES[oi] } });
    if (!office) {
      office = await prisma.office.create({ data: { name: OFFICE_NAMES[oi] } });
    }
    offices.push(office);

    const email = `officeadmin${oi + 1}@cms.gov`;
    await prisma.admin.upsert({
      where: { email },
      update: {},
      create: {
        fullName: `${OFFICE_NAMES[oi]} Admin`,
        email,
        passwordHash,
        adminType: "OFFICE_ADMIN",
        roleId: roles["Office Admin Role"].id,
        officeId: office.id,
      },
    });
    if (oi === 0) loginTable.push({ role: "OFFICE_ADMIN", email });
  }

  console.log("Seeding demo citizen accounts...");
  const citizens = [];
  for (let i = 1; i <= 5; i++) {
    const email = `citizen${i}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        fullName: `Demo Citizen ${i}`,
        email,
        phone: `+25261234500${i}`,
        passwordHash,
        isEmailVerified: true,
      },
    });
    citizens.push(user);
    if (i === 1) loginTable.push({ role: "USER", email });
  }

  console.log("Seeding demo complaints...");
  const statuses = ["PENDING", "UNDER_REVIEW", "ASSIGNED", "IN_PROGRESS", "WAITING", "SOLVED", "CLOSED", "TRANSFERRED", "REJECTED", "ESCALATED"];
  const allDistricts = await prisma.district.findMany({ take: 20 });
  for (let i = 0; i < 30; i++) {
    const status = statuses[i % statuses.length];
    const district = allDistricts[i % allDistricts.length];
    const category = categories[i % categories.length];
    const isAnonymous = i % 4 === 0;
    const submitter = isAnonymous ? null : citizens[i % citizens.length];

    await prisma.complaint.create({
      data: {
        trackingId: `CMS-2026-DEMO${String(i + 1).padStart(3, "0")}`,
        title: `${category.name} issue #${i + 1}`,
        description: `Demo seeded complaint describing a ${category.name.toLowerCase()} issue reported by a citizen for testing dashboards and workflows.`,
        location: `${district.name} center`,
        status,
        categoryId: category.id,
        districtId: district.id,
        zoneId: district.zoneId,
        isAnonymous,
        submitterId: submitter?.id ?? null,
        guestFullName: isAnonymous ? `Anonymous Reporter ${i + 1}` : undefined,
        statusHistory: { create: { toStatus: "PENDING", changedByType: "SYSTEM", reason: "Seed data" } },
      },
    });
  }

  console.log("\n================ SEEDED LOGIN CREDENTIALS ================");
  console.log(`Password for ALL seeded accounts: ${DEV_PASSWORD}\n`);
  console.table(loginTable);
  console.log("Full lists follow the pattern: zoneadmin<1-11>_<1-2>@cms.gov, districtadmin<1-95>_<1-2>@cms.gov,");
  console.log("townadmin<1-6>_<1-2>@cms.gov, officeadmin<1-8>@cms.gov, superadmin<1-2>@cms.gov, citizen<1-5>@example.com");
  console.log("============================================================\n");

  console.timeEnd("seed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
