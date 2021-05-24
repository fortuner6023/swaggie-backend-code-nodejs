const createError = require("http-errors");

module.exports = function (req, res, next) {
  if (!req.baseUrl.includes(req.user.type)) {
    throw createError(401);
  } else {
    return next();
  }
};
