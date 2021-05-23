const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema({
  socialUID: { type: String, required: false },
  email: { type: String, required: true },
  emailVerified: { type: Boolean, required: true, default: false },
  profileVerified: { type: Boolean, required: true, default: false },
  verificationCode: { type: String, required: true },
  password: { type: String, required: true },
  type: { type: String, required: true },
  status: {
    type: String,
    required: true,
    default: "active"
  },
  agreeTerms: {
    type: Boolean
  }
});

exports.Users = mongoose.model("swaggie_prod_users", UserSchema);
