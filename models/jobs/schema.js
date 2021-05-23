const Yup = require("yup");
// Query params: location, category/ies, perk/s, start date

// Job search
exports.searchJobs = Yup.object().shape({
  limit: Yup.number().default(10),
  location: Yup.string().uppercase().nullable(),
  categories: Yup.array()
    .of(
      Yup.string().matches(
        /(adventure|bar|hair|admin|picking|retail|hotel|labourer|aupair)/
      )
    )
    .nullable(),
  perks: Yup.array()
    .of(Yup.string().matches(/(visa|meals|accomodation|relocation|other)/))
    .nullable(),
  startDate: Yup.date().nullable()
});

exports.createJobs = Yup.object().shape({
  name: Yup.string().required(),
  categories: Yup.array().min(1),
  hoursPerFortnight: Yup.string().required(),
  startDate: Yup.date().required(),
  unit: Yup.string(),
  street: Yup.string().required(),
  suburb: Yup.string().required(),
  postcode: Yup.string().required(),
  address: Yup.string().required(),
  country: Yup.string().required(),
  state: Yup.string()
    .matches(/^(QLD|NSW|ACT|VIC|TAS|SA|WA|NT|NOT SPECIFIED)$/)
    .uppercase()
    .required(),
  jobPerk: Yup.array(),
  skillLevel: Yup.string(),
  refCode: Yup.string(),
  jobRequirements: Yup.string().required(),
  lat:Yup.number(),
  long:Yup.number(),
  nationalEmployment: Yup.boolean()
});

exports.createTempJobs = Yup.object().shape({
  name: Yup.string().required(),
  categories: Yup.array().min(1),
  hoursPerFortnight: Yup.string().required(),
  startDate: Yup.date().required(),
  unit: Yup.string(),
  street: Yup.string().required(),
  suburb: Yup.string().required(),
  postcode: Yup.string().required(),
  address: Yup.string().required(),
  country: Yup.string().required(),
  state: Yup.string()
    .matches(/^(QLD|NSW|ACT|VIC|TAS|SA|WA|NT|NOT SPECIFIED)$/)
    .uppercase()
    .required(),
  jobPerk: Yup.array(),
  skillLevel: Yup.string(),
  refCode: Yup.string(),
  jobRequirements: Yup.string().required(),
  nationalEmployment: Yup.boolean(),
  lat:Yup.number(),
  long:Yup.number()
});

exports.updateJobs = Yup.object().shape({
  name: Yup.string().required(),
  categories: Yup.array().min(1),
  hoursPerFortnight: Yup.string().required(),
  startDate: Yup.date().required(),
  unit: Yup.string(),
  street: Yup.string().required(),
  suburb: Yup.string().required(),
  postcode: Yup.string().required(),
  address: Yup.string().required(),
  country: Yup.string().required(),
  state: Yup.string()
    .matches(/^(QLD|NSW|ACT|VIC|TAS|SA|WA|NT)$/)
    .uppercase()
    .required(),
  jobPerk: Yup.array(),
  skillLevel: Yup.string(),
  jobRequirements: Yup.string().required(),
  lat:Yup.number().required(),
  long:Yup.number().required(),
  nationalEmployment: Yup.boolean()
});

exports.createEOI = Yup.object().shape({
  jobID: Yup.string().required("Job ID is required"),
  message: Yup.string().notRequired("EOI message is optional")
});

exports.updateStatus = Yup.object().shape({
  id: Yup.string().required("Job id is required"),
  status: Yup.string().required("Job status is required")
});

exports.updateApplicant = Yup.object().shape({
  worker: Yup.string().required("Worker id is required"),
  shortlist: Yup.boolean()
    .required("Shortlist status is required")
    .default(false),
  visibility: Yup.boolean().required("Visibility is required").default(true)
});
