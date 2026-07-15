function success(res, { statusCode = 200, message = "OK", data = null, meta = undefined } = {}) {
  return res.status(statusCode).json({ success: true, message, data, meta });
}

function failure(res, { statusCode = 500, message = "Something went wrong", errors = undefined } = {}) {
  return res.status(statusCode).json({ success: false, message, errors });
}

class ApiError extends Error {
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

module.exports = { success, failure, ApiError };
