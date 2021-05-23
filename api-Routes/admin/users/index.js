const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const asyncHandler = require("express-async-handler");
const schema = require("../../../models/admin/users/schema");
const bcrypt = require("bcrypt");
const { Admins } = require("../../../models/admin/users/model");
const {
  JWK, // JSON Web Key (JWK)  
  JWT // JSON Web Token (JWT)
} = require("jose");
const fs = require("fs");
const auth = require("../../../middleware/authentication");
const jwtKey = process.env.JWT_KEY

/**
 * @typedef RegisterResponse
 * @property {boolean} success
 */
/**
 * Create a new admin user and issue an authentication token
 * @route POST /admin/users
 * @param {string} email.body.required - email
 * @param {string} password.body.required - password.
 * @returns {RegisterResponse.model} 201 - Status code
 * @produces application/json
 * @consumes application/json
 */
router.post(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const values = await schema.createSession
      .validate(req.body, {
        abortEarly: false
      })
      .catch(errors => {
        console.error(errors);
        throw createError(400, {
          message: "Invalid request, missing or invalid fields",
          errors: errors.errors
        });
      });
    // Check for duplicates
    const isDuplicate = await Admins.findOne({
      email: values.email
    });
    if (isDuplicate !== null)
      throw createError(400, "Email address already in use");

    // Create user
    const pass = await bcrypt.hash(
      values.password,
      Number(process.env.HASH_ROUNDS)
    );
    const admin = await Admins.create({ email: values.email, password: pass });
    token = JWT.sign(
      { userId: admin._id, profileVerified: true, type: "admin" },
      jwtKey,
      {
        expiresIn: "10h"
      }
    );
    res.status(201).json({ success: true, token });
  })
);

/**
 * @typedef LoginResponse
 * @property {string} token A JWT used for authentication
 */
/**
 * Issues a JWT for the admin user. Used to support logging in.
 * @route POST /admin/users/sessions
 * @param {string} email.body - email address.
 * @param {string} password.body - user's password.
 * @returns {LoginResponse.model} 200 - The authentication token
 * @produces application/json
 * @consumes application/json
 */
router.post(
  "/sessions",
  asyncHandler(async (req, res) => {
    const values = await schema.createSession
      .validate(req.body, {
        abortEarly: false
      })
      .catch(errors => {
        console.error(errors);
        throw createError(400, {
          message: "Invalid request",
          errors: errors.errors
        });
      });
    const record = await Admins.findOne({ email: values.email });
    if (!record) {
      throw createError(
        400,
        "Email not found, check your email address, or request admin access"
      );
    }
    if (!(await bcrypt.compare(req.body.password, record.password)))
      throw createError(401, "Invalid credentials");

    // Issue token
    token = JWT.sign(
      { userId: record._id, profileVerified: true, type: "admin" },
      jwtKey,
      {
        expiresIn: "2 hours"
      }
    );
    res.status(200).json({ token });
  })
);

module.exports = router;
