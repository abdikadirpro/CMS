const prisma = require("../config/db");
const { ApiError, success } = require("../utils/apiResponse");

async function listRoles(req, res, next) {
  try {
    const roles = await prisma.role.findMany({
      include: { permissions: { include: { permission: true } }, _count: { select: { admins: true } } },
      orderBy: { name: "asc" },
    });
    return success(res, { data: roles });
  } catch (err) {
    next(err);
  }
}

async function createRole(req, res, next) {
  try {
    const { name, description, permissionCodes = [] } = req.body;
    const role = await prisma.role.create({
      data: {
        name,
        description,
        permissions: {
          create: permissionCodes.map((code) => ({ permission: { connect: { code } } })),
        },
      },
      include: { permissions: { include: { permission: true } } },
    });
    return success(res, { statusCode: 201, message: "Role created", data: role });
  } catch (err) {
    next(err);
  }
}

async function updateRole(req, res, next) {
  try {
    const { name, description, permissionCodes } = req.body;
    const role = await prisma.role.findUnique({ where: { id: req.params.id } });
    if (!role) throw new ApiError(404, "Role not found");

    if (Array.isArray(permissionCodes)) {
      await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    }

    const updated = await prisma.role.update({
      where: { id: role.id },
      data: {
        name,
        description,
        ...(Array.isArray(permissionCodes)
          ? { permissions: { create: permissionCodes.map((code) => ({ permission: { connect: { code } } })) } }
          : {}),
      },
      include: { permissions: { include: { permission: true } } },
    });

    return success(res, { message: "Role updated", data: updated });
  } catch (err) {
    next(err);
  }
}

async function deleteRole(req, res, next) {
  try {
    await prisma.role.delete({ where: { id: req.params.id } });
    return success(res, { message: "Role deleted" });
  } catch (err) {
    next(err);
  }
}

async function listPermissions(req, res, next) {
  try {
    const permissions = await prisma.permission.findMany({ orderBy: { code: "asc" } });
    return success(res, { data: permissions });
  } catch (err) {
    next(err);
  }
}

module.exports = { listRoles, createRole, updateRole, deleteRole, listPermissions };
