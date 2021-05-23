require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const { errorHandler, route404Handler } = require("./middleware/errorHandler");
const apiRouter = require("./features");
const testServer = express();

testServer.use(logger("dev"));
testServer.use(cors());
testServer.use(express.json());
testServer.use(express.urlencoded({ extended: false }));
testServer.use(cookieParser());
testServer.use(express.static(path.join(__dirname, "public")));

// Route definitions
testServer.use("/api", apiRouter);

// Error handling
testServer.use(route404Handler);
testServer.use(errorHandler);

module.exports = testServer;
