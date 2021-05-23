const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const asyncHandler = require("express-async-handler");
const employer = require("../../features/employers/model");
const employerSchema = require("../../features/employers/schema");
const auth = require("../../middleware/authentication");
const verification = require("../../middleware/verification");
const routeGuard = require("../../middleware/routeGuard");
const { Users } = require("../../features/users/model");
const { v4: uuidv4 } = require("uuid");
const NodeGeocoder = require('node-geocoder');
var ObjectId = require('mongodb').ObjectID;
/**
 * Return is array of employer profile
 * @route POST /api
 * @group Swaggie - Operations for Swaggie
 * @param {string} entityName.body.required - entity Name
 * @param {string} contactPerson.body.required - contact person
 * @param {string} phone.body.required - phone
 * @param {string} abn.body.required - ABN
 * @param {string} unitLevel.body.required - unit/level
 * @param {string} street.body.required - street
 * @param {string} city.body.required - city
 * @param {string} postCode.body.required - post code
 * @param {string} state.body.required - state
 * @param {string} companyDesc.body.required - company description
 * @param {boolean} isAgency.body.required - is agency
 * @param {boolean} updateTerm.body.required - receive Swaggie Updates
 * @returns {object} 200 - An array of profile
 * @returns {Error}  400 - ABN already exist
 */

router.post(
  "/",
  auth,
  routeGuard,
  asyncHandler(async (req, res, next) => {
    const validate = await employerSchema.createEmployer
      .validate(req.body, {
        abortEarly: false
      })
      .catch(errors => {
        throw createError(400, {
          message: "Missing or invalid fields",
          errors: errors.errors
        });
      });

    const abnQuery = await employer.findOne({ abn: req.body.abn });

    if (abnQuery) {
      throw createError(400, "ABN already exists");
    }
    validate._userId = req.user.id;
    const createEmployer = await employer.create(validate);

    const user = await Users.findOne({ _id: req.user.id }).catch(error => {
      console.error(error);
      throw createError(500, "User not found");
    });
    user.verificationCode = uuidv4();
    user.save();

    res.status(200).json(createEmployer);
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
    const profile = await employer
      .findOne({ _userId: req.user.id })
      .catch(errors => {
        throw createError(400, errors.errors);
      });
    res.status(200).json(profile);
  })
);

router.post(
  "/update",
  auth,
  routeGuard,
  asyncHandler(async (req, res, next) => {
    const profile = await employer
      .findOne({ _userId: req.user.id })
      .catch(errors => {
        throw createError(400, errors.errors);
      });

    const validate = await employerSchema.updateEmployer
      .validate(req.body, {
        abortEarly: false
      })
      .catch(errors => {
        throw createError(400, {
          message: "Missing or invalid fields",
          errors: errors.errors
        });
      });

    const updateEmployer = await employer
      .findByIdAndUpdate({ _id: req.body._id }, validate, {
        useFindAndModify: false
      })
      .catch(error => {
        console.error(error);
        throw createError(500, "Error updating profile");
      });
    res.status(200).json(updateEmployer);
  })
);

/**
 * Return is list of verified employer
 * @route GET /api
 * @group Swaggie - Operations for Swaggie
 * @returns {object} 200 - list of verified woker
 */
router.get(
  "/",
  auth,
  asyncHandler(async (req, res, next) => {
    let userIds = [];
    const employerResult = new Promise((resolve, reject) => {
      employer.find().populate("_userId")
        .exec(function (err, employers) {
          if(err)
            reject(err);
          employers = employers.map(function(employer) {
            employer.set('createdDate', ObjectId(employer._id).getTimestamp().toDateString(), {strict: false});
            if(employer && employer._userId && employer._userId._id){
              userIds.push(employer._userId._id);
            }
            return employer;
          });
          resolve(employers)
        })
    });
    await employerResult.then(async employers => {
      const userList = await Users.find({_id: { "$nin": userIds} ,type: "employer"})
      res.status(200).json([...employers, ...userList]);
    }).catch((error)=>{
      return res.send(500);
    });
  })
);

function getStateCode(state = "") {
  switch (state.toUpperCase()) {
    case "QUEENSLAND": {
      return "QLD";
    }
    case "NEW SOUTH WALES": {
      return "NSW";
    }
    case "VICTORIA": {
      return "VIC";
    }
    case "AUSTRALIAN CAPITAL TERRITORY": {
      return "ACT";
    }
    case "TASMANIA": {
      return "TAS";
    }
    case "SOUTH AUSTRALIA": {
      return "SA";
    }
    case "NORTHERN TERRITORY": {
      return "NT";
    }
    case "WESTERN AUSTRALIA": {
      return "WA";
    }
    case "QLD": {
      return "QLD";
    }
    case "NSW": {
      return "NSW";
    }
    case "VIC": {
      return "VIC";
    }
    case "ACT": {
      return "ACT";
    }
    case "TAS": {
      return "TAS";
    }
    case "SA": {
      return "SA";
    }
    case "NT": {
      return "NT";
    }
    case "WA": {
      return "WA";
    }
    default: {
      return "";
    }
  }
}
async function getCurrentLatLong(address) {
  const options = {
    provider: 'google',
    apiKey: 'AIzaSyACKy3XCQPhROetcXNY08PvTt9dF8xIMyA', // for Mapquest, OpenCage, Google Premier
    formatter: null // 'gpx', 'string', ...
  };
  const geocoder = NodeGeocoder(options);
  const latLongdata = await geocoder.geocode(address);
  let currentUserLatLong = {
    "lat": latLongdata != "" ? latLongdata[0].latitude : "",
    "long": latLongdata != "" ? latLongdata[0].longitude : ""
  }
  return currentUserLatLong
}

router.get(
  "/searchByAddress",
  auth,
  asyncHandler(async (req, res, next) => {
    await getCurrentLatLong(req.query.address)
    const stateData = await getStateCode(req.query.address)
    const employers = await employer
      .find({state:stateData})
      .populate("_userId")
      .catch(error => {
        console.error(error);
        throw createError(500, error.errors);
      });
    res.status(200).json(employers);
  })
);
module.exports = router;
