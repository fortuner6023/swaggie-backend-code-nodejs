const Yup = require("yup");

// For creating a user
exports.createUser = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Email is required"),
  password: Yup.string().required("Password is required"),
  type: Yup.string()
    .matches(/(employer|worker)/)
    .required("User type is required (worker or employer)"),
  /*agreeTerms: Yup.boolean()
    .required("Please agree to our Terms & Conditions to continue")
    .oneOf([true], "Please agree to our Terms & Conditions to continue")*/
});

// For login requests
exports.createSession = Yup.object().shape({
  email: Yup.string().required("Email is required"),
  password: Yup.string().required("Password is required")
});

exports.socialSession = Yup.object().shape({
  email: Yup.string().required("Email is required"),
  token: Yup.string().required("Firebase Auth ID token is required")
});

exports.updateUser = Yup.object().shape({
  id: Yup.string().required("User id is requires"),
  status: Yup.string()
    .matches(/(suspend|active)/)
    .required("Status is required")
});
