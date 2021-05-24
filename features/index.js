const express = require("express");
const router = express.Router();

router.use("/workers", require("./workers"));
router.use("/jobs", require("./jobs"));
router.use("/employers", require("./employers"));
router.use("/users", require("./users"));
router.use("/uploads", require("./uploads"));
router.use("/uploadFiles", require("./uploadFiles"));
router.use("/admin", require("./admin"));

module.exports = router;
