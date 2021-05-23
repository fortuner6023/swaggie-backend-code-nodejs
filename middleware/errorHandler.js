const createError = require("http-errors");

const errorHandler = (error, req, res, next) => {
  // Set status code
  res.status(error.status || 500);
  console.error(error);
  // create response
  const errors = {
    status: error.status,
    message: error.message,
    errors: error.errors ? error.errors : "",
  };
  if (process.env.NODE_ENV === "development") {
    errors.stack = error.stack;
  }

  // Sends response
  res.json(errors);
};

const route404Handler = (req, res, next) => {
  next(createError(404));
};

module.exports = { errorHandler, route404Handler };
