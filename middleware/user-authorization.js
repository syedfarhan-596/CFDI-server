const { BadRequestError, UnauthorizedError } = require("../errors");
const jwt = require("jsonwebtoken");

const UserAuthorizationMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ");
  if (!token[0].startsWith("Bearer")) {
    throw new BadRequestError("Invalid token format");
  }
  const user = jwt.verify(token[1], process.env.JWT_SECRET);
  if (!user) {
    throw new UnauthorizedError("Invalid token");
  }
  req.user = user;
  next();
};

module.exports = UserAuthorizationMiddleware;
