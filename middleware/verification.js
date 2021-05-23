const createError = require("http-errors");

const { Users } = require("../models/users/model");
/**
 * Marks a user as verified once they complete their profile
 */
module.exports = async (req, res, next) => {
  try {
    await Users.findByIdAndUpdate(req.user.id, { profileVerified: true });
  } catch (error) {
    console.log(error);
    throw createError(500, "Profile verification failed");
  }
};
