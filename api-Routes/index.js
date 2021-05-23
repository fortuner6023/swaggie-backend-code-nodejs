const express = require("express");
const router = express.Router();

const workersRoute = require("../workers/index");
const jobsRoute = require("./jobs/index.js");
const employersRoute = require("./employers/index.js");
const usersRoute = require("./users/index.js");
const uploadsRoute = require("./uploads/index.js");
const uploadFilesRoute = require("./uploadFiles/index.js");
const adminRoute = require("./admin/users/index.js");

router.use("/workers", workersRoute);
router.use("/jobs", jobsRoute);
router.use("/employers", employersRoute);
router.use("/users", usersRoute);
router.use("/uploads", uploadsRoute);
router.use("/uploadFiles", uploadFilesRoute);
router.use("/admin", adminRoute);

module.exports = router;
