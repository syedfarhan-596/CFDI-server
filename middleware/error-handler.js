const { StatusCodes } = require("http-status-codes");

const ErrorHandlierMiddleware = (err, req, res, next) => {
  const customError = {
    msg: err.message || "Internal Server Error",
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
  };

  res.status(customError.statusCode).json({ message: customError.msg });
};

module.exports = ErrorHandlierMiddleware;
