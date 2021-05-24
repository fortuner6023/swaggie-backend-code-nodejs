const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const asyncHandler = require("express-async-handler");
const { Workers } = require("./model");
const workerSchema = require("./schema");
const auth = require("../../middleware/authentication");
const verification = require("../../middleware/verification");
const routeGuard = require("../../middleware/routeGuard");
const { v4: uuidv4 } = require("uuid");
const { Users } = require("../users/model");
const { Jobs } = require("../jobs/model");
var ObjectId = require('mongodb').ObjectID;
/**
 * Creates a worker profile
 * @route POST /workers
 * @group Swaggie - Operations for Swaggie
 * @param {string} firstName.body.required - first name
 * @param {string} lastName.body.required - last name
 * @param {string} email.body.required - email
 * @param {number} phone.body.required - phone
 * @param {number} unit.body - unit Level
 * @param {string} street.body.required - street
 * @param {string} suburb.body.required - city
 * @param {string} postCode.body.required - post code
 * @param {string} state.body.required - state
 * @param {array} categories.body.required - job category
 * @param {date} availableFrom.body.required - availability start from
 * @param {date} availableUntil.body - availability until to
 * @param {string} HoursFortnight.body.required - hours per fortnight
 * @param {array} dayShift.body - Daily availability required
 * @param {array} nightShift.body - Daily availability required
 * @param {array} earlyShift.body -  Daily availability required
 * @param {string} interestLocation.body.required - interest Location
 * @param {string} aboutYou.body.required - about you
 * @param {boolean} isLegally.body.required - is Legally
 * @param {boolean} agreeTerms.body.required - agree terms
 * @param {string} photoUrl.body - photo url
 *
 * @returns {object} 200 - An array of profile
 */
router.post(
  "/",
  auth,
  routeGuard,
  asyncHandler(async (req, res, next) => {
    const findWorker = await Workers.findOne({ _userId: req.user.id }).catch(
      errors => {
        throw createError(400, {
          message: "Worker already created",
          errors: errors.errors
        });
      }
    );
    if (findWorker !== null) {
      throw createError(400, "Worker already created");
    }
    const validate = await workerSchema.createWorker
      .validate(req.body, {
        abortEarly: false
      })
      .catch(errors => {
        throw createError(400, {
          message: "Missing or invalid fields",
          errors: errors.errors
        });
      });

    validate._userId = req.user.id;
    const createWorker = await Workers.create(validate).catch(error => {
      console.error(error);
      throw createError(500, "Error creating profile");
    });
    const user = await Users.findOne({ _id: req.user.id }).catch(error => {
      console.error(error);
      throw createError(500, "User not found");
    });
    user.verificationCode = uuidv4();
    user.save();

    res.status(200).json(createWorker);
    next();
  }),
  verification
);

/**
 * Return is array of profile
 * @route GET /api
 * @group Swaggie - Operations for Swaggie
 * @returns {object} 200 - An array of profile
 */
router.get(
  "/profile",
  auth,
  asyncHandler(async (req, res, next) => {
    const profile = await Workers.findOne({ _userId: req.user.id }).catch(
      errors => {
        throw createError(400, errors.errors);
      }
    );
    res.status(200).json(profile);
  })
);

/**
 * Return is list of verified woker
 * @route GET /api
 * @group Swaggie - Operations for Swaggie
 * @returns {object} 200 - list of verified woker
 */
router.get(
  "/",
  auth,
  asyncHandler(async (req, res, next) => {
    let userIds = [];
    const workerResult = new Promise((resolve, reject) => {
      Workers.find().populate("_userId")
        .exec(function (err, workers) {
          if(err)
            reject(err);
          workers = workers.map(function(Worker) {
            Worker.set('createdDate', ObjectId(Worker._id).getTimestamp().toDateString(), {strict: false});
            if(Worker && Worker._userId && Worker._userId._id){
              userIds.push(Worker._userId._id);
            }
            return Worker;
          });
          resolve(workers);
        })
    });
    await workerResult.then(async workers => {
      const userList = await Users.find({_id: { "$nin": userIds} ,type: "worker"})
        res.status(200).json([...workers, ...userList]);
    }).catch((error)=> {
        return res.send(500);
    });
  })
);
/**
 * Return is array of profile
 * @route POST /api
 * @group Swaggie - Operations for Swaggie
 * @param {string} firstName.body.required - first name
 * @param {string} lastName.body.required - last name
 * @param {string} email.body.required - email
 * @param {number} phone.body.required - phone
 * @param {number} unit.body - unit Level
 * @param {string} street.body.required - street
 * @param {string} suburb.body.required - city
 * @param {string} postCode.body.required - post code
 * @param {string} state.body.required - state
 * @param {array} categories.body.required - job category
 * @param {date} availableFrom.body.required - availability start from
 * @param {date} availableUntil.body - availability until to
 * @param {string} HoursFortnight.body.required - hours per fortnight
 * @param {array} dayShift.body - Daily availability required
 * @param {array} nightShift.body - Daily availability required
 * @param {array} earlyShift.body -  Daily availability required
 * @param {string} interestLocation.body.required - interest Location
 * @param {string} aboutYou.body.required - about you
 * @param {boolean} isLegally.body.required - is Legally
 * @param {boolean} agreeTerms.body.required - agree terms
 * @param {string} photoUrl.body - photo url
 *
 * @returns {object} 200 - An array of profile
 */
router.post(
  "/update",
  auth,
  routeGuard,
  asyncHandler(async (req, res, next) => {
    const profile = await Workers.findOne({ _userId: req.user.id }).catch(
      errors => {
        throw createError(400, errors.errors);
      }
    );

    const validate = await workerSchema.updateWorker
      .validate(req.body, {
        abortEarly: false
      })
      .catch(errors => {
        throw createError(400, {
          message: "Missing or invalid fields",
          errors: errors.errors
        });
      });
    const updateWorker = await Workers.findByIdAndUpdate(
      { _id: req.body._id },
      validate,
      { useFindAndModify: false }
    ).catch(error => {
      console.error(error);
      throw createError(500, "Error updating profile");
    });
    res.status(200).json(updateWorker);
  })
);

/**
 * Return is list of worker's EOI
 * @route GET /api
 * @group Swaggie - Operations for Swaggie
 * @returns {object} 200 - list of worker's EOI
 */
router.get(
  "/applications",
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.type !== "worker")
      throw createError(
        401,
        "Your account is not authorized to get applications"
      );

    const jobs = await Jobs.find();
    const filterJobs = jobs.filter(job =>
      job.expressionsOfInterest.find(
        el => el.worker.toString() === req.user.id && el.status === "applied"
      )
    );
    res.status(200).json(filterJobs);
  })
);

/**
 * @route PUT /api
 * @group Swaggie - Operations for Swaggie
 * @param {string} jobId.required - Job Id
 * @param {string} lastName.body.required - EOI Id
 * @returns {object} 200
 */
router.put(
  "/applications/withdrawn",
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.type !== "worker")
      throw createError(
        401,
        "Your account is not authorized to withdraw applications"
      );

    const findJob = await Jobs.findById({ _id: req.body.jobId }).catch(
      errors => {
        throw createError(400, {
          message: "Job not found",
          errors: errors.errors
        });
      }
    );
    // const eoiIdx = findJob.expressionsOfInterest.findIndex(
    //   el => el.worker.toString() === req.user.id
    // );
    // findJob.expressionsOfInterest[eoiIdx].status = "withdrawn";
    findJob.expressionsOfInterest = findJob.expressionsOfInterest.filter(
      el => el.worker.toString() !== req.user.id
    );
    findJob.save();

    res.status(200).send();
  })
);
module.exports = router;
