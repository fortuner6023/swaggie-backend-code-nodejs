const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CategorySchema = new mongoose.Schema({
  swaggie: { type: String },
  jobg8: { type: String },
  photoUrl: { type: String }
});

exports.Categories = mongoose.model("Categories", CategorySchema);
