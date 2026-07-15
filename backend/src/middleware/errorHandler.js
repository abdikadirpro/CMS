const { ApiError, failure } = require("../utils/apiResponse");
const logger = require("../utils/logger");

function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return failure(res, { statusCode: err.statusCode, message: err.message, errors: err.errors });
  }

  if (err.code === "P2002") {
    return failure(res, { statusCode: 409, message: "A record with this value already exists" });
  }
  if (err.code === "P2025") {
    return failure(res, { statusCode: 404, message: "Record not found" });
  }
  if (err.code === "P2003") {
    return failure(res, {
      statusCode: 409,
      message: "This record still has other records depending on it (e.g. districts, offices, or admins) — reassign or remove those first, then try deleting it again.",
    });
  }

  logger.error(err);
  return failure(res, {
    statusCode: 500,
    message: process.env.NODE_ENV === "development" ? err.message : "Internal server error",
  });
}

module.exports = { notFoundHandler, errorHandler };
