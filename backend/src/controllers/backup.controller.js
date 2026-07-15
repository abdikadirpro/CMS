const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const { ApiError, success } = require("../utils/apiResponse");
const { logActivity } = require("../services/activityLog.service");
const env = require("../config/env");

const BACKUP_DIR = path.join(__dirname, "..", "..", "backups");
fs.mkdirSync(BACKUP_DIR, { recursive: true });

async function list(req, res, next) {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith(".sql"))
      .map((f) => {
        const stats = fs.statSync(path.join(BACKUP_DIR, f));
        return { fileName: f, sizeBytes: stats.size, createdAt: stats.birthtime };
      })
      .sort((a, b) => b.createdAt - a.createdAt);
    return success(res, { data: files });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const fileName = `backup-${Date.now()}.sql`;
  const filePath = path.join(BACKUP_DIR, fileName);

  execFile(
    "pg_dump",
    ["--dbname", env.databaseUrl, "-f", filePath, "--no-owner", "--no-privileges"],
    async (error, stdout, stderr) => {
      if (error) {
        return next(
          new ApiError(
            500,
            `Backup failed: ${stderr || error.message}. Ensure the PostgreSQL 'pg_dump' tool is installed and on your system PATH.`
          )
        );
      }

      await logActivity({
        actor: { type: "ADMIN", id: req.actor.id, fullName: req.actor.fullName },
        action: "BACKUP_CREATED",
        targetType: "System",
        metadata: { fileName },
      });

      return success(res, { statusCode: 201, message: "Backup created", data: { fileName } });
    }
  );
}

async function download(req, res, next) {
  const filePath = path.join(BACKUP_DIR, path.basename(req.params.fileName));
  if (!fs.existsSync(filePath)) return next(new ApiError(404, "Backup file not found"));
  res.download(filePath);
}

module.exports = { list, create, download };
