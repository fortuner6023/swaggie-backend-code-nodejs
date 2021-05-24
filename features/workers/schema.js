const Yup = require("yup");

exports.createWorker = Yup.object().shape({
  firstName: Yup.string().required(),
  lastName: Yup.string().required(),
  phone: Yup.string().required(),
  suburb: Yup.string().required(),
  postcode: Yup.string().required(),
  address: Yup.string().required(),
  country: Yup.string().required(),
  state: Yup.string(),
  isLegally: Yup.boolean().required(),
  updateTerm: Yup.boolean(),
  availableFrom: Yup.date().required(),
  hoursFortnight: Yup.number().required(),
  categories: Yup.array().min(1)
});

exports.updateWorker = Yup.object().shape({
  unit: Yup.string().nullable(true),
  firstName: Yup.string().required(),
  lastName: Yup.string().required(),
  phone: Yup.string().required(),
  suburb: Yup.string().required(),
  postcode: Yup.string().required(),
  address: Yup.string().required(),
  country: Yup.string().required(),
  state: Yup.string(),
  isLegally: Yup.boolean().required(),
  updateTerm: Yup.boolean(),
  availableFrom: Yup.date().required(),
  availableUntil: Yup.date().nullable(true),
  hoursFortnight: Yup.number().required(),
  categories: Yup.array().min(1)
});
