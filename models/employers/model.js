const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Employer = new mongoose.Schema({
  _userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  entityName: { type: String, required: true },
  contactPerson: { type: String, required: true },
  phone: { type: String, required: true },
  abn: { type: String, required: true },
  abnVerify: { type: Boolean, default: false },
  unit: { type: String, required: false },
  street: { type: String, required: true },
  suburb: { type: String, required: true },
  postcode: { type: String, required: true },
  state: { type: String, required: true },
  address: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  companyDesc: { type: String },
  isAgency: { type: Boolean, required: true, default: false },
  updateTerm: { type: Boolean, required: true, default: false },
  photoUrl: { type: String },
  lat: { type: Number, required: true },
  long: { type: Number, required: true }
});

const model = mongoose.model("swaggie_prod_employers", Employer);

module.exports = model;
