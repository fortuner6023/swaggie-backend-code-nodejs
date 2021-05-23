const mongoose = require("mongoose");
const { Schema } = mongoose;
const Employer = mongoose.model(
  "Employer",
  new Schema({
    entityName: {
      type: String,
      required: true
    }
  })
);
const Worker = mongoose.model("Worker", new Schema({}));
exports.Jobs = mongoose.model(
  "swaggie_prod_jobs",
  new Schema({
    posted: {
      type: Date,
      required: true,
      default: new Date().toISOString()
    },
    status: {
      type: String,
      required: true,
      default: "unpublished"
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true
    },
    refCode: { type: String, required: false },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: false, maxlength: 2048, trim: true },
    unit: { type: String, required: false, trim: true },
    street: { type: String, required: true, trim: true },
    suburb: { type: String, required: true, uppercase: true, trim: true },
    state: {
      type: String,
      required: true,
      enum: [
        "QLD",
        "NSW",
        "VIC",
        "TAS",
        "SA",
        "NT",
        "WA",
        "ACT",
        "NOT SPECIFIED"
      ],
      trim: true
    },
    postcode: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    rate: { type: String, required: false },
    rateType: {
      type: String,
      enum: ["piece", "hour", "other"],
      required: true,
      default: "hour"
    },
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
          "aupair",
          "other"
        ]
      }
    ],
    penaltyRates: { type: Boolean, required: true, default: false },
    accomodation: { type: Boolean, required: false, default: false },
    visa: { type: Boolean, required: false, default: false },
    isG8Job: { type: Boolean, required: false, default: false },
    meals: { type: Boolean, required: false, default: false },
    relocation: { type: Boolean, required: false, default: false },
    other: { type: Boolean, required: false, default: false },
    startDate: { type: Date, required: true, default: new Date() },
    endDate: { type: Date, required: false },
    ongoingEngagement: { type: Boolean, required: false },
    nationalEmployment: { type: Boolean, required: false },
    hoursPerFortnight: { type: Number, required: true, default: 0 },
    jobRequirements: {
      type: String,
      required: true,
      trim: true
    },
    skillLevel: {
      type: String,
      required: true,
      enum: ["noCertification", "assistCertification", "bothRequired", "other"]
    },
    jobPerk: [
      {
        type: String,
        enum: ["accomodation", "meals", "visa", "relocation", "other"]
      }
    ],
    photoUrl: { type: String },
    nightShift: { type: Array },
    earlyShift: { type: Array },
    dayShift: { type: Array },
    expressionsOfInterest: [
      {
        worker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Worker,
          required: false
        },
        message: { type: String, required: false },
        created: {
          type: Date,
          required: true,
          default: new Date().toISOString()
        },
        shortlisted: { type: Boolean, required: true, default: false },
        visible: { type: Boolean, required: true, default: true },
        status: { type: String, required: true, default: "applied" }
      }
    ],
    position: { type: String, required: false, maxlength: 70 },
    applicationUrl: { type: String, required: false, maxlength: 255 },
    descriptionUrl: { type: String, required: false, maxlength: 255 },
    employmentType: { type: String, required: false, maxlength: 70 },
    lanugage: { type: String, required: false, maxlength: 10 },
    workingHours: { type: String, required: false, maxlength: 70 },
    jobSource: { type: String, required: true, default: "inside" },
    lat: { type: Number, required: true, default: false },
    long: { type: Number, required: true, default: false }
  })
);

exports.TempJobs = mongoose.model(
  "TempJobs",
  new Schema({
    posted: {
      type: Date,
      required: true,
      default: new Date().toISOString()
    },
    status: {
      type: String,
      required: true,
      default: "unpublished"
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employer",
      required: true
    },
    refCode: { type: String, required: false },
    name: { type: String, required: true, trim: true },
    image: { type: String, required: false, maxlength: 2048, trim: true },
    unit: { type: String, required: false, trim: true },
    street: { type: String, required: true, trim: true },
    suburb: { type: String, required: true, uppercase: true, trim: true },
    state: {
      type: String,
      required: true,
      enum: [
        "QLD",
        "NSW",
        "VIC",
        "TAS",
        "SA",
        "NT",
        "WA",
        "ACT",
        "NOT SPECIFIED"
      ],
      trim: true
    },
    postcode: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    rate: { type: String, required: false },
    rateType: {
      type: String,
      enum: ["piece", "hour", "other"],
      required: true,
      default: "hour"
    },
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
          "aupair",
          "other"
        ]
      }
    ],
    penaltyRates: { type: Boolean, required: true, default: false },
    accomodation: { type: Boolean, required: false, default: false },
    visa: { type: Boolean, required: false, default: false },
    isG8Job: { type: Boolean, required: false, default: false },
    meals: { type: Boolean, required: false, default: false },
    relocation: { type: Boolean, required: false, default: false },
    other: { type: Boolean, required: false, default: false },
    startDate: { type: Date, required: true, default: new Date() },
    endDate: { type: Date, required: false },
    ongoingEngagement: { type: Boolean, required: false },
    nationalEmployment: { type: Boolean, required: false },
    hoursPerFortnight: { type: Number, required: true, default: 0 },
    jobRequirements: {
      type: String,
      required: true,
      trim: true
    },
    skillLevel: {
      type: String,
      required: true,
      enum: ["noCertification", "assistCertification", "bothRequired", "other"]
    },
    jobPerk: [
      {
        type: String,
        enum: ["accomodation", "meals", "visa", "relocation", "other"]
      }
    ],
    photoUrl: { type: String },
    nightShift: { type: Array },
    earlyShift: { type: Array },
    dayShift: { type: Array },
    expressionsOfInterest: [
      {
        worker: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Worker,
          required: false
        },
        message: { type: String, required: false },
        created: {
          type: Date,
          required: true,
          default: new Date().toISOString()
        },
        shortlisted: { type: Boolean, required: true, default: false },
        visible: { type: Boolean, required: true, default: true },
        status: { type: String, required: true, default: "applied" }
      }
    ],
    position: { type: String, required: false, maxlength: 70 },
    applicationUrl: { type: String, required: false, maxlength: 255 },
    descriptionUrl: { type: String, required: false, maxlength: 255 },
    employmentType: { type: String, required: false, maxlength: 70 },
    lanugage: { type: String, required: false, maxlength: 10 },
    workingHours: { type: String, required: false, maxlength: 70 },
    jobSource: { type: String, required: true, default: "inside" },
    lat: { type: Number, required: true, default: false },
    long: { type: Number, required: true, default: false }
  })
);