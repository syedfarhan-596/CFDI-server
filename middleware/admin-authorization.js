const { BadRequestError, UnauthorizedError } = require("../errors");
const jwt = require("jsonwebtoken");

const AdminAuthenticationMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");

  const token = authHeader?.split(" ");
  if (!token[0].startsWith("Bearer")) {
    throw new BadRequestError("Invalid token format");
  }
  const admin = jwt.verify(token[1], process.env.ADMIN_JWT_SECRET);
  if (!admin) {
    throw new UnauthorizedError("Not valid token");
  }
  req.admin = admin;
  next();
};

module.exports = AdminAuthenticationMiddleware;
