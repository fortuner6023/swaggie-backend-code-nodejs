const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WorkerSchema = new mongoose.Schema({
  _userId: { type: Schema.Types.ObjectId, ref: "Users", required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String, required: true },
  unit: { type: String, required: false },
  street: { type: String, required: false },
  suburb: { type: String, required: true },
  postcode: { type: String, required: true },
  state: { type: String },
  address: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  categories: [
    {
      type: String,
      required: true,
      enum: [
        "adventure",
        "bar",
        "hair",
        "admin",
        "picking",
        "retail",
        "hotel",
        "labourer",
        "aupair"
      ]
    }
  ],
  availableFrom: { type: Date },
  availableUntil: { type: Date, required: false },
  interestLocation: { type: String, required: true },
  hoursFortnight: { type: Number },
  aboutYou: { type: String },
  isLegally: { type: Boolean, required: true },
  updateTerm: { type: Boolean, required: false },
  dayShift: [String],
  nightShift: [String],
  earlyShift: [String],
  photoUrl: { type: String }
});

exports.Workers = mongoose.model("swaggie_prod_workers", WorkerSchema);
