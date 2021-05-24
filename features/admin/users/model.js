const mongoose = require("mongoose");
const { Schema } = mongoose;

const AdminSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true }
});

exports.Admins = mongoose.model("swaggie_prod_admins", AdminSchema);
