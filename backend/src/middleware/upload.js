const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const env = require("../config/env");

const uploadDir = path.join(__dirname, "..", "..", "uploads", "complaints");
fs.mkdirSync(uploadDir, { recursive: true });

const memberUploadDir = path.join(__dirname, "..", "..", "uploads", "members");
fs.mkdirSync(memberUploadDir, { recursive: true });

const donationUploadDir = path.join(__dirname, "..", "..", "uploads", "donations");
fs.mkdirSync(donationUploadDir, { recursive: true });

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

function makeFilename(req, file, cb) {
  const unique = crypto.randomBytes(16).toString("hex");
  cb(null, `${Date.now()}-${unique}${path.extname(file.originalname)}`);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: makeFilename,
});

const memberStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, memberUploadDir),
  filename: makeFilename,
});

const donationStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, donationUploadDir),
  filename: makeFilename,
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error("Unsupported file type"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: env.upload.maxFileSizeMb * 1024 * 1024, files: 5 },
  fileFilter,
});

const memberUpload = multer({
  storage: memberStorage,
  limits: { fileSize: env.upload.maxFileSizeMb * 1024 * 1024, files: 1 },
  fileFilter,
});

const donationUpload = multer({
  storage: donationStorage,
  limits: { fileSize: env.upload.maxFileSizeMb * 1024 * 1024, files: 1 },
  fileFilter,
});

module.exports = { upload, uploadDir, memberUpload, memberUploadDir, donationUpload, donationUploadDir };
