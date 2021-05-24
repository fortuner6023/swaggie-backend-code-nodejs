const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const asyncHandler = require("express-async-handler");
const { Jobs, TempJobs, FinalJobs } = require("./model");
var mongoose = require("mongoose");
const {
  searchJobs,
  createJobs,
  createEOI,
  updateStatus,
  updateApplicant,
  updateJobs,
  createTempJobs
} = require("./schema");
const auth = require("../../middleware/authentication");
const employer = require("../employers/model");
const { Workers } = require("../workers/model");
const { Users } = require("../users/model");
const { Categories } = require("../jobs/category/model");

const compareAsc = require("date-fns/compareAsc");
const formatISO = require("date-fns/formatISO");
const firebase = require("../../middleware/firebase");
const isValid = require("date-fns/isValid");
const NodeGeocoder = require("node-geocoder");

/**
 * Retrieve a list of jobs
 * @route GET /jobs
 * @param {Array} perks.query - a list of perks to search for
 * @param {Array} categories.query - a list of categories to search in
 * @param {String} startDate.query - filters jobs with a start < startDate
 * @param {String} location.query - the suburb, state, or postcode to search in
 * @produces application/json
 * @consumes application/json
 */
async function getEmployeeName(empName) {
  const emp = await employer.find({ entityName: new RegExp(".*" + empName + ".*", "i") }, { _id: 1 });
  const empArray = [];
  emp.map(id => {
    let empid = mongoose.Types.ObjectId(id._id);
    empArray.push(empid);
  });
  return empArray;
}

async function getCurrentLatLong(address) {
  const options = {
    provider: "google",
    apiKey: "AIzaSyACKy3XCQPhROetcXNY08PvTt9dF8xIMyA", // for Mapquest, OpenCage, Google Premier
    formatter: null // 'gpx', 'string', ...
  };
  const geocoder = NodeGeocoder(options);
  const latLongdata = await geocoder.geocode(address);
  let currentUserLatLong = {
    "lat": latLongdata != "" ? latLongdata[0].latitude : "",
    "long": latLongdata != "" ? latLongdata[0].longitude : ""
  };
  return currentUserLatLong;
}

async function getsearchByAddress(address) {
  const options = {
    provider: "google",
    apiKey: "AIzaSyACKy3XCQPhROetcXNY08PvTt9dF8xIMyA", // for Mapquest, OpenCage, Google Premier
    formatter: null // 'gpx', 'string', ...
  };
  const geocoder = NodeGeocoder(options);
  const latLongdata = await geocoder.geocode(address);
  let currentSearchBy = {
    "ZipCode": latLongdata[0].zipcode != undefined ? latLongdata[0].zipcode : null,
    "state": latLongdata[0].administrativeLevels.level1long,
    "stateSh": latLongdata[0].administrativeLevels.level1short,
    "suburb": latLongdata[0].city || (latLongdata[0].administrativeLevels.level2short != undefined && latLongdata[0].administrativeLevels.level2short) || null,
    "street": (!!latLongdata[0].streetName && latLongdata[0].streetName) || null
  };
  return currentSearchBy;

}

async function distance(lat1, lon1, lat2, lon2, unit) {
  if ((lat1 == lat2) && (lon1 == lon2)) {
    return 0;
  } else {
    var radlat1 = Math.PI * lat1 / 180;
    var radlat2 = Math.PI * lat2 / 180;
    var theta = lon1 - lon2;
    var radtheta = Math.PI * theta / 180;
    var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
      dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == "K") {
      dist = dist * 1.609344;
    }
    if (unit == "N") {
      dist = dist * 0.8684;
    }
    return dist;
  }
}

async function getAllJobLatLong(userCurrentLatLong, radius) {
  const jobsData = await Jobs.find({}, { _id: 1, lat: 1, long: 1 });
  const jobIdArray = [];
  if (jobsData != "") {
    if (radius != undefined) {
      for (var item of jobsData) {
        if (item.lat != 0 && item.long != 0) {
          const getDistance = await distance(userCurrentLatLong.lat, userCurrentLatLong.long, item.lat, item.long, "K");
          if (parseInt(getDistance) <= parseInt(radius)) {
            let jobId = mongoose.Types.ObjectId(item._id);
            jobIdArray.push(jobId);
          }
        }
      }
      return jobIdArray;
    }
  }
}

async function getAllJobLatLongWithOutMatchInterest(userCurrentLatLong, radius) {
  const jobsData = await Jobs.find({}, { _id: 1, lat: 1, long: 1 });
  const jobIdArray = [];
  if (jobsData != "") {
    let dataWithIdAndLatLong = [];
    for (var jobItem of jobsData) {
      if (jobItem.lat != 0 && jobItem.long != 0) {
        const getDistance = await distance(userCurrentLatLong.lat, userCurrentLatLong.long, jobItem.lat, jobItem.long, "K");
        dataWithIdAndLatLong.push({ "jobId": jobItem._id, "distance": parseInt(getDistance) });
      }
    }
    var min = Math.min.apply(null, dataWithIdAndLatLong.map(item => item.distance));
    let closestJobId = [];
    for (var jobid of dataWithIdAndLatLong) {
      if (jobid.distance == min) {
        let jobId = mongoose.Types.ObjectId(jobid.jobId);
        closestJobId.push(jobId);
      }
    }
    return closestJobId;

  }
}

router.get(
  "/",
  asyncHandler(async (req, res, next) => {
    const values = await searchJobs
      .validate(req.query, {
        abortEarly: false
      })
      .catch(errors => {
        console.error(errors);
        throw createError(400, {
          message: "Missing or invalid fields",
          errors: errors.errors
        });
      });
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    let search = {
      status: "published"
    };
    const keys = Object.keys(values);
    if (keys.includes("location") && values.location.length > 0) {
      search.$and = [];
      if (getStateCode(values.location).length > 0) {
        search.$and.push({ state: getStateCode(values.location) });
      } else if (Number(values.location) > 0) {
        search.$and.push({ postcode: values.location });
      } else {
        search.$and.push({ suburb: values.location });
      }
    }
    if (keys.includes("allLocation") && values.allLocation != null && values.allLocation != "") {
      const getSearchByLocation = await getsearchByAddress(values.allLocation);
      if (getSearchByLocation.street) {
        search.$and = [];
        search.$and.push({ street: new RegExp(".*" + getSearchByLocation.street + ".*", "i") });
      } else if (getSearchByLocation.suburb) {
        search.$and = [];
        search.$and.push({ suburb: new RegExp(".*" + getSearchByLocation.suburb + ".*", "i") });
      } else if (getSearchByLocation.stateSh) {
        search.$and = [];
        search.$and.push({ state: new RegExp(".*" + getSearchByLocation.stateSh + ".*", "i") });
      } else {
        if (getSearchByLocation.ZipCode != null) {
          search.$and = [];
          search.$and.push({ postcode: new RegExp(".*" + getSearchByLocation.ZipCode + ".*", "i") });
        }
      }
    }
    if (keys.includes("allLocation") && values.allLocation != null && values.allLocation != "" && values.allLocation != undefined && values.radius > 0 && values.radius <= 100) {
      let rangeOfRadius = values.radius;
      const userCurrentLatLong = await getCurrentLatLong(values.allLocation);
      const allUserLatLong = await getAllJobLatLong(userCurrentLatLong, rangeOfRadius);
      search.$and = search.$and || [];
      search.$and.push({ _id: { $in: allUserLatLong } });
    }
    if (keys.includes("perks") && values.perks !== null) {
      search.jobPerk = { $in: values.perks };
    }
    if (keys.includes("categories") && values.categories !== null) {
      search.categories = { $in: values.categories };
    }
    if (keys.includes("state") && values.state !== "") {
      const stateName = await getStateCode(values.state);
      let stateValue = new RegExp(".*" + stateName + ".*", "i");
      Object.assign(search, { "state": stateValue });
    }
    // if (keys.includes("keywords") && values.keywords !== '') {
    //   Object.assign(search,{"name":new RegExp('.*' + values.keywords + '.*', 'i')})
    // }
    if (keys.includes("keywords") && values.keywords !== "") {
      const empIds = await getEmployeeName(values.keywords);
      if (empIds != "") {
        Object.assign(search, { "employer": { $in: empIds } });
        // search.$and.push({ employer: { $in: empIds } });
      } else {
        Object.assign(search, { "name": new RegExp(".*" + values.keywords + ".*", "i") });
      }
    }
    if (keys.includes("minhoursfilter") && values.minhoursfilter !== "") {
      Object.assign(search, { "hoursPerFortnight": { $gt: parseInt(values.minhoursfilter) } });
      // search.$and.push({ hoursPerFortnight: { $gt: parseInt(values.minhoursfilter) } });
    }
    if (keys.includes("startDate") && isValid(values.startDate)) {
      if (!search.$and) search.$and = [];
      search.$and.push({
        $or: [
          {
            endDate: {
              $gte: new Date(
                formatISO(new Date(values.startDate))
                  .toString()
                  .substring(0, 10)
              )
            }
          },
          { ongoingEngagement: true }
        ]
      });
    }
    let sortBy = req.query.isWorker == 1 ? { isG8Job: 1, hoursPerFortnight: 1 } : { isG8Job: 1, startDate: 1 } ;
    if (keys.includes("sortBy") && values.sortBy) {
      sortBy = {[values.sortBy]: 1}
    }
    let jobs = await Jobs.aggregate([
      // { $match: search },
      { $match: search },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $skip: offset },
            { $limit: values.limit },
            { $sort: sortBy},
            {
              $lookup: {
                from: "employers",
                localField: "employer",
                foreignField: "_id",
                as: "employer"
              }
            }
          ]
        }
      }
    ]);
    if (jobs[0].metadata != "" && jobs[0].data != "") {
      res.status(200).json({
        jobs: jobs[0].data,
        totalCount: jobs[0].metadata.length > 0 ? jobs[0].metadata[0].total : 0
      });
    } else {
      if (values.allLocation != null && values.allLocation != "" && values.allLocation != undefined) {
        const userCurrentLatLong = await getCurrentLatLong(values.allLocation);
        const allUserLatLong = await getAllJobLatLongWithOutMatchInterest(userCurrentLatLong);
        search.$and = [];
        search.$and.push({ _id: { $in: allUserLatLong } });
        let jobs = await Jobs.aggregate([
          { $match: search },
          {
            $facet: {
              metadata: [{ $count: "total" }],
              data: [
                { $skip: offset },
                { $limit: values.limit },
                { $sort: sortBy},
                {
                  $lookup: {
                    from: "employers",
                    localField: "employer",
                    foreignField: "_id",
                    as: "employer"
                  }
                }
              ]
            }
          }
        ]);
        res.status(200).json({
          jobs: jobs[0].data,
          totalCount: jobs[0].metadata.length > 0 ? jobs[0].metadata[0].total : 0
        });
      } else {
        res.status(200).json({
          jobs: jobs[0].data,
          totalCount: jobs[0].metadata.length > 0 ? jobs[0].metadata[0].total : 0
        });
      }
    }
  })
);


/******************************************************* */
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


/**
 * Creates a job posting
 * @route POST /jobs
 * @param {string} jobTitle.body.required - job title
 * @param {array} jobCategory.body.required - job category
 * @param {string} phone.body.required - phone
 * @param {string} hourlyRate.body.required - hourly rate
 * @param {string} pieceWorkRate.body.required - piece work rate
 * @param {string} HoursFortnight.body.required - hours per fortnight
 * @param {date} startFrom.body.required - availability start from
 * @param {date} untilTo.body.required - availability until to
 * @param {date} sunRequired.body.required - Daily availability required
 * @param {date} moonRequired.body.required - Daily availability required
 * @param {date} sunriseRequired.body.required -  Daily availability required
 * @param {string} street.body.required - street
 * @param {string} city.body.required - city
 * @param {string} postCode.body.required - post code
 * @param {string} state.body.required - state
 * @param {string} jobDsc.body.required - job description
 * @returns {object} 200 - An array of profile
 * @returns {Error}  400 - ABN aready exist
 */

router.post(
  "/",
  auth,
  asyncHandler(async (req, res, next) => {
    if (req.user.type !== "employer")
      throw createError(403, "Your account is not authorized to post jobs");
    if (!req.user.profileVerified)
      throw createError(401, "Unverified employers cannot post a job");

    const findemployer = await employer
      .findOne({ _userId: req.user.id })
      .catch(errors => {
        throw createError(400, {
          message: "Can not find employer",
          errors: errors.errors
        });
      });
    if (findemployer === "") {
      throw createError(400, "Can not find employer");
    }
    const validate = await createJobs
      .validate(req.body, {
        abortEarly: false
      })
      .catch(errors => {
        throw createError(400, {
          message: "Missing or invalid fields",
          errors: errors.errors
        });
      });

    validate.employer = findemployer;

    const createJob = await Jobs.create(validate);
    res.status(200).json(createJob);
  })
);

router.get(
  "/employer",
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.type !== "employer" && req.user.type !== "admin")
      throw createError(401);
    const { limit, archived } = req.query;

    const employerID = await employer.findOne({ _userId: req.user.id });
    const searchObj = {
      employer: employerID && employerID._id,
      status: { $ne: "archived" }
    };
    if (archived === "true") {
      delete searchObj.status;
    }
    const records = await Jobs.find(searchObj)
      .sort("posted")
      .limit(Number(limit));

    res.status(200).json(records);
  })
);

router.get(
  "/admin",
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.type !== "admin") {
      throw createError("User is not admin", 401);
    }
    const records = await Jobs.find();
    res.status(200).json(records);
  })
);

router.put(
  "/status",
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.type !== "employer" && req.user.type !== "admin")
      throw createError(401);

    const values = await updateStatus
      .validate(req.body, {
        abortEarly: false
      })
      .catch(errors => {
        console.error(errors);
        throw createError(400, {
          message: "Missing or invalid fields",
          errors: errors.errors
        });
      });
    const job = await Jobs.findById(values.id);

    if (req.user.type === "employer") {
      const employerID = await employer.findOne({ _userId: req.user.id });
      if (job.employer.toString() !== employerID._id.toString()) {
        throw createError(400, "You can only update your own jobs");
      }
    }

    job.status = values.status;
    await job.save();
    res.status(204).send();
  })
);

/**
 * Retrieve job applicants
 * @route GET /applicants/:jobId
 * @param {String} jobId.path - the job to retrieve applicants for
 * @produces application/json
 */
router.get(
  "/applicants/:jobId",
  auth,
  asyncHandler(async (req, res) => {
    // Check user type
    if (req.user.type !== "employer" && req.user.type !== "admin")
      throw createError(401);

    // Retrieve and populate applicants for the job
    const jobPost = await Jobs.findById(req.params.jobId);
    const user = await employer.findById(jobPost.employer);
    if (!user || (user._userId.toString() !== req.user.id && req.user.type !== "admin"))
      throw createError(401);
    const applicantList = jobPost.expressionsOfInterest.map(el => {
      return Workers.findOne({ _userId: el.worker });
    });

    const applicants = await Promise.all(applicantList);
    const emailList = [];
    applicants.forEach(el => {
      if (el) {
        emailList.push(Users.findById(el._userId));
      }
    });
    const fullList = await Promise.all(emailList);

    const result = [];
    jobPost.expressionsOfInterest.forEach(el => {
      const { email = "" } = fullList.find(fl => fl && (fl._id.toString() === el.worker.toString())) || {};
      const applicant = applicants.find(pr => pr && (pr._userId.toString() === el.worker.toString()));
      if (applicant) {
        result.push({
          email: email,
          ...applicant._doc,
          ...el._doc
        });
      }
    });

    // Return
    res.status(200).json(result);
  })
);

/**
 * Update an applicant's status for a job
 * @route PUT /applicants/:jobId/:worker
 * @param {String} jobId.path - the job to update the applicant for
 * @param {String} worker.body - the applicant to update
 * @param {Boolean} shortlist.body - the applicant shortlist status
 * @param {Boolean} visibility.body - the applicant visibility status
 * @produces application/json
 */
router.put(
  "/applicant/:jobId",
  auth,
  asyncHandler(async (req, res) => {
    // Check user type
    if (req.user.type !== "employer" && req.user.type !== "admin")
      throw createError(401);
    const values = await updateApplicant
      .validate(req.body, {
        abortEarly: false
      })
      .catch(errors => {
        console.error(errors);
        throw createError(400, {
          message: "Missing or invalid fields",
          errors: errors.errors
        });
      });
    // Retrieve and populate applicants for the job
    const jobPost = await Jobs.findById(req.params.jobId);
    const user = await employer.findById(jobPost.employer);
    if (user._userId.toString() !== req.user.id && req.user.type !== "admin")
      throw createError(401);

    const eoiIdx = jobPost.expressionsOfInterest.findIndex(
      el => el.worker.toString() === values.worker
    );
    jobPost.expressionsOfInterest[eoiIdx].shortlist = values.shortlist;
    jobPost.expressionsOfInterest[eoiIdx].visibility = values.visibility;
  })
);
/**
 * Retrieve a specific job
 * @route GET /jobs/:jobId
 * @param {String} jobId.path - the job to retrieve
 * @produces application/json
 */
router.get(
  "/:jobId",
  asyncHandler(async (req, res) => {
    const jobId = req.params.jobId;
    const jobs = await Jobs.findById(jobId)
      .populate("employer")
      .catch(error => {
        console.error(error);
        throw createError(400, "The specified job does not exist");
      });
    res.status(200).json(jobs);
  })
);

/**
 * Create an expression of interest in a job
 * @route GET /jobs/:jobId
 * @param {String} jobId.path - the job to retrieve
 * @produces application/json
 */
router.put(
  "/interest",
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.type === "employer")
      throw createError(403, "Employers cannot apply for jobs");
    const values = await createEOI
      .validate(req.body, { abortEarly: false })
      .catch(error => {
        throw createError(400, {
          message: "Missing or invalid fields",
          errors: error.errors
        });
      });

    const job = await Jobs.findById(values.jobID);
    if (
      job.expressionsOfInterest &&
      job.expressionsOfInterest.findIndex(
        el => el.worker.toString() === req.user.id
      ) === -1
    ) {
      job.expressionsOfInterest.push({
        worker: req.user.id,
        message: values.message
      });
    } else {
      job.expressionsOfInterest[
        job.expressionsOfInterest.findIndex(
          el => el.worker.toString() === req.user.id
        )
        ].message = values.message;
    }
    await job.save();
    res.status(200).json({
      status: "success",
      message: "Expression of interest registered"
    });
  })
);

/**
 * Update Job
 * @route Put /job
 * @param {string} jobTitle.body.required - job title
 * @param {array} jobCategory.body.required - job category
 * @param {string} phone.body.required - phone
 * @param {string} hourlyRate.body.required - hourly rate
 * @param {string} pieceWorkRate.body.required - piece work rate
 * @param {string} HoursFortnight.body.required - hours per fortnight
 * @param {date} startFrom.body.required - availability start from
 * @param {date} untilTo.body.required - availability until to
 * @param {date} sunRequired.body.required - Daily availability required
 * @param {date} moonRequired.body.required - Daily availability required
 * @param {date} sunriseRequired.body.required -  Daily availability required
 * @param {string} street.body.required - street
 * @param {string} city.body.required - city
 * @param {string} postCode.body.required - post code
 * @param {string} state.body.required - state
 * @param {string} jobDsc.body.required - job description
 * @returns {object} 200 - An array of profile
 * @returns {Error}  400 - ABN aready exist
 */
router.put(
  "/:jobId",
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.type !== "employer")
      throw createError(403, "Your account is not authorized to update jobs");
    if (!req.user.profileVerified)
      throw createError(401, "Unverified employers cannot update a job");

    const validate = await updateJobs
      .validate(req.body, {
        abortEarly: false
      })
      .catch(errors => {
        throw createError(400, {
          message: "Missing or invalid fields",
          errors: errors.errors
        });
      });

    const jobId = req.params.jobId;
    const job = await Jobs.findById(jobId).catch(error => {
      console.error(error);
      throw createError(400, error.errors);
    });

    if (
      job.status === "published" ||
      job.status === "paused" ||
      job.status === "archived"
    ) {
      throw createError(401, `You can not update ${job.status} job`);
    }
    const updateJob = await Jobs.findByIdAndUpdate({ _id: jobId }, validate, {
      useFindAndModify: false
    }).catch(error => {
      console.error(error);
      throw createError(500, "Error update job");
    });
    res.status(200).json(updateJob);

  })
);

router.post(
  "/upload",
  auth,
  asyncHandler(async (req, res) => {
    if (req.user.type !== "employer")
      throw createError(403, "Your account is not authorized to upload jobs");

    const findEmployer = await employer
      .findOne({ _userId: req.user.id })
      .catch(errors => {
        throw createError(400, {
          message: "Can not find employer",
          errors: errors.errors
        });
      });
    const jobs = req.body;
    jobs.forEach(async job => {
      const validate = await createJobs
        .validate(job, {
          abortEarly: false
        })
        .catch(errors => {
          throw createError(400, {
            message: "Missing or invalid fields",
            errors: errors.errors
          });
        });

      validate.employer = findEmployer;
      await Jobs.create(validate);
    });
    res.status(200).send();
  })
);

/**
 * POST from job G8
 */
router.post(
  "/jobG8",
  asyncHandler(async (req, res) => {
    if (!req.headers.authorization || req.headers.authorization.indexOf("Basic ") === -1) {
      return res.status(401).send();
    }

    const basicAuth = req.headers.authorization.split(" ")[1];
    const credentials = Buffer.from(basicAuth, "base64").toString("ascii");
    const [userName, password] = credentials.split(":");
    const g8Job = req.body;
    const findUser = await Users.findOne({ email: userName }).catch(errors => {
      throw createError(400, {
        message: "Can not find user",
        errors: errors.errors
      });
    });

    const findemployer = await employer
      .findOne({ _userId: findUser._id })
      .catch(errors => {
        throw createError(400, {
          message: "Can not find employer",
          errors: errors.errors
        });
      });

    // commented the code which cleared the Jobs table data for first Job G8
    //   if (g8Job && g8Job.Clean && g8Job.Clean == '1') {
    //     console.log('****CLEANING ALL JOBS FIRST');
    //     await Jobs.deleteMany({
    //         employer: findemployer._id
    //     }).catch(error => {
    //         throw createError(400, {
    //             message: "Delete Jobs fail",
    //             error
    //         });
    //     });
    // }

    const findCategory = await Categories.find().catch(errors => {
      throw createError(400, {
        message: "Can not find categories",
        errors: errors.errors
      });
    });

    if (g8Job && g8Job.Job) {
      // for (let job of g8Job.Job) {
      const date = new Date(),
        job = JSON.parse(g8Job.Job),
        suburb = job.Area && job.Area[0] || "",
        state = job.Location && job.Location[0] && getStateCode(job.Location[0].trim().toUpperCase()) || "",
        country = job.Country && job.Country[0] || "";

      const duplicateJobs = await Jobs.find({ street: suburb, suburb: suburb, state: state, country: country });

      let tempJob = {
        status: "published",
        name: "",
        categories: [],
        hoursPerFortnight: "0",
        startDate: new Date(),
        endDate: date.setDate(date.getDate() + 30),
        street: "",
        suburb: "",
        postcode: "",
        state: "",
        country: "",
        address: "",
        skillLevel: "other",
        jobRequirements: "",
        rate: "",
        rateType: "other",
        ongoingEngagement: true,
        isG8Job: true,
        nationalEmployment: true,
        refCode: "",
        lat: "",
        long: "",
        applicationUrl: "",
        descriptionUrl: "",
        employmentType: "",
        workingHours: "",
        photoUrl: "",
        jobSource: "outside"
      };
      findCategory.find(el => {
        if (el.jobg8 === job.Classification[0]) {
          tempJob.categories[0] = el.swaggie;
          tempJob.photoUrl = el.photoUrl ? el.photoUrl : "";
          return true;
        } else {
          tempJob.categories[0] = "other";
          tempJob.photoUrl = el.photoUrl ? el.photoUrl : "";
        }
      });

      tempJob.name = job.Position[0];
      tempJob.refCode = job.SenderReference[0];
      tempJob.postcode = job.PostalCode ? job.PostalCode[0] : "0000";
      tempJob.jobRequirements = job.Description[0];
      tempJob.applicationUrl = job.ApplicationURL[0];
      tempJob.descriptionUrl = job.DescriptionURL
        ? job.DescriptionURL[0]
        : "";
      tempJob.employmentType = job.EmploymentType[0];
      tempJob.workingHours = job.WorkHours[0];


      tempJob.suburb = suburb || "N/A";
      tempJob.state = state || "NOT SPECIFIED";
      tempJob.street = suburb || "N/A";
      tempJob.country = country || "N/A";
      const tempAddress = suburb + " " + state + " " + country;
      tempJob.address = tempAddress || "N/A";

      console.log("duplicateJobs.length: ",duplicateJobs.length);
      if (duplicateJobs && duplicateJobs.length && duplicateJobs[0].lat && duplicateJobs[0].long) {
        console.log("DUPLICATE JOB USED");
        tempJob.lat = duplicateJobs[0].lat || 0;
        tempJob.long = duplicateJobs[0].long || 0;
      } else {
        console.log("LAT LONG CALCULATED");
        const userCurrentLatLong = await getCurrentLatLong(tempAddress);
        tempJob.lat = !isNaN(userCurrentLatLong.lat) && userCurrentLatLong.lat || 0;
        tempJob.long = !isNaN(userCurrentLatLong.long) && userCurrentLatLong.long || 0;
      }
      const validateTempJob = await createTempJobs
        .validate(tempJob, {
          abortEarly: false
        })
        .catch(errors => {
          throw createError(400, {
            message: "Validate Job Failed",
            errors: errors.errors
          })
        });
      validateTempJob.employer = findemployer._id;
      await TempJobs.create(validateTempJob).catch(error => {
        throw createError(400, {
          message: "Create Temp Job failed",
          error
        });
      });
    }
    res.status(200).send("Success");
  }));


router.post("/removeJobG8",
  asyncHandler(async (req, res) => {
    console.log("First : ", new Date());
    const findJob = await TempJobs.find().lean();
    console.log("");
    console.log("SECOND : ", new Date());
    const basicAuth = req.headers.authorization.split(" ")[1];
    const credentials = Buffer.from(basicAuth, "base64").toString("ascii");
    const [userName, password] = credentials.split(":");
    const findUser = await Users.findOne({ email: userName }).catch(errors => {
      throw createError(400, {
        message: "Can not find user",
        errors: errors.errors
      });
    });
    console.log("findUser, ",findUser);
      console.log("");

    const findemployer = await employer
      .findOne({ _userId: findUser._id })
      .catch(errors => {
        throw createError(400, {
          message: "Can not find employer",
          errors: errors.errors
        });
      });
    console.log("findemployer, ",findemployer);
      console.log("");
      console.log("findJob : ",findJob.length);

    await Jobs.deleteMany({
      employer: findemployer._id
    }).catch(error => {
      throw createError(400, {
        message: "Delete Jobs fail",
        error
      });
    });
    console.log("");
    console.log("JOB DELETED : ");

    // let allJobs = []
    // console.log("");
    // console.log("findJob : ",findJob.length);
    // findJob.forEach(async (jobDoc) => {
    //   var date = new Date();
    //   let job = {
    //     status: "published",
    //     name: "",
    //     categories: [],
    //     hoursPerFortnight: "0",
    //     startDate: new Date(),
    //     endDate: date.setDate(date.getDate() + 30),
    //     street: "",
    //     suburb: "",
    //     postcode: "",
    //     state: "",
    //     country: "",
    //     address: "",
    //     skillLevel: "other",
    //     jobRequirements: "",
    //     rate: "",
    //     rateType: "other",
    //     ongoingEngagement: true,
    //     isG8Job: true,
    //     refCode: "",
    //     lat: "",
    //     long: "",
    //     applicationUrl: "",
    //     descriptionUrl: "",
    //     employmentType: "",
    //     workingHours: "",
    //     photoUrl: "",
    //     jobSource: "outside"
    //   };
    //   job.categories = jobDoc.categories.slice();
    //   job.photoUrl = jobDoc.photoUrl ? jobDoc.photoUrl : "";
    //
    //   job.name = jobDoc.name;
    //   job.refCode = jobDoc.refCode;
    //   job.postcode = jobDoc.postcode ? jobDoc.postcode : "0000";
    //   job.jobRequirements = jobDoc.jobRequirements;
    //   job.applicationUrl = jobDoc.applicationUrl;
    //   job.descriptionUrl = jobDoc.descriptionUrl
    //     ? jobDoc.descriptionUrl
    //     : "";
    //   job.employmentType = jobDoc.employmentType;
    //   job.workingHours = jobDoc.workingHours;
    //
    //   job.suburb = jobDoc.suburb || "N/A";
    //   job.state = jobDoc.state || "NOT SPECIFIED";
    //   job.street = jobDoc.street || "N/A";
    //   job.country = jobDoc.country || "N/A";
    //   job.address = jobDoc.address || "N/A";
    //   job.lat = jobDoc.lat;
    //   job.long = jobDoc.long;
    //
    //
    //   const validateJob = await createJobs
    //     .validate(job, {
    //       abortEarly: false
    //     }).catch(error => {
    //       throw createError(400, {
    //         message: "Validate Job fail",
    //         error
    //       });
    //     });
    //
    //   validateJob.employer = jobDoc.employer;
    //   allJobs.push(validateJob)
    //   // await Jobs.create(job).catch(error => {
    //   //   throw createError(400, {
    //   //     message: "Create Job fail",
    //   //     error
    //   //   });
    //   // });
    // });
    // console.log("");
    // console.log("allJobs : ",allJobs.length);

    await Jobs.insertMany(findJob).catch(error => {
      throw createError(400, {
        message: "Create Jobs Failed",
        error
      })
    })
    console.log("");
    console.log("JOB INSERTED : ");

    await TempJobs.deleteMany().catch(error => {
      throw createError(400, {
        message: "Remove TempJob fail",
        error
      });
    });
    console.log("");
    console.log("TEMPJOB DELETED : ");
    res.status(200).send("Success");
  }))

module.exports = router;
