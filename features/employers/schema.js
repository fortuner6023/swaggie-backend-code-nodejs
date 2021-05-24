const Yup = require("yup");

exports.createEmployer = Yup.object().shape({
  entityName: Yup.string().required(),
  contactPerson: Yup.string().required(),
  phone: Yup.string().required(),
  abn: Yup.string().required(),
  street: Yup.string().required(),
  suburb: Yup.string().required(),
  postcode: Yup.string().required(),
  address: Yup.string().required(),
  country: Yup.string().required(),
  state: Yup.string()
    .matches(/^(QLD|NSW|ACT|VIC|TAS|SA|WA|NT)$/)
    .uppercase()
    .required(),
  companyDesc: Yup.string(),
  isAgency: Yup.boolean().required(),
  updateTerm: Yup.boolean(),
  unit: Yup.string().nullable(true),
  lat: Yup.number().required(),
  long: Yup.number().required()
});

exports.updateEmployer = Yup.object().shape({
  entityName: Yup.string().required(),
  contactPerson: Yup.string().required(),
  phone: Yup.string().required(),
  abn: Yup.string().required(),
  street: Yup.string().required(),
  suburb: Yup.string().required(),
  postcode: Yup.string().required(),
  address: Yup.string().required(),
  country: Yup.string().required(),
  state: Yup.string()
    .matches(/^(QLD|NSW|ACT|VIC|TAS|SA|WA|NT)$/)
    .uppercase()
    .required(),
  companyDesc: Yup.string(),
  isAgency: Yup.boolean().required(),
  updateTerm: Yup.boolean(),
  unit: Yup.string().nullable(true),
  lat: Yup.number().required(),
  long: Yup.number().required()
});
