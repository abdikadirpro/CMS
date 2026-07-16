require("dotenv").config();

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Dashboard env-var UIs (Render, etc.) can smuggle in a trailing newline or slash when a value is
// pasted — either breaks a raw HTTP header (Node throws "Invalid character in header content") or
// silently fails a CORS origin match. Strip both defensively rather than trusting the raw value.
function sanitizeUrl(value) {
  if (!value) return value;
  return value.trim().replace(/\/+$/, "");
}

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "5000", 10),
  clientUrl: sanitizeUrl(process.env.CLIENT_URL) || "http://localhost:5173",
  databaseUrl: required("DATABASE_URL"),
  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET"),
    refreshSecret: required("JWT_REFRESH_SECRET"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },
  upload: {
    maxFileSizeMb: parseInt(process.env.UPLOAD_MAX_FILE_SIZE_MB || "10", 10),
  },
};
