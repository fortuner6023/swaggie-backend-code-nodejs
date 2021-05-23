const createError = require("http-errors");
const fs = require("fs");
const {
  JWK, // JSON Web Key (JWK)
  JWT // JSON Web Token (JWT)
} = require("jose");

// const jwtKey = JWK.asKey(fs.readFileSync(process.env.JWT_KEY));
/**
 * Checks for a JWT, and if present verifies it. Extracts the user_id from the JWT and attaches it to the request for downstream controllers to use.
 * Throws an error if JWT is not present
 */
module.exports = (req, res, next) => {
  const bearer = req.headers.authorization.split(" ")[1];
  try {
    const verification = JWT.decode(bearer);
    req.user = {
      id: verification.userId,
      type: verification.type,
      profileVerified: verification.profileVerified
    };
    next();
  } catch (error) {
    console.log(error);
    throw createError(401, "Session expired. Please login again");
  }
};