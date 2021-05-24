const aws = require("aws-sdk");
const express = require("express");
const router = express.Router();
const createError = require("http-errors");
const asyncHandler = require("express-async-handler");
const auth = require("../../middleware/authentication");
const { Categories } = require("../jobs/category/model");

const S3_BUCKET = process.env.Bucket;
aws.config.update({
  region: process.env.REGION, // Put your aws region here
  accessKeyId: process.env.AWSAccessKeyId,
  secretAccessKey: process.env.AWSSecretKey
});
const s3 = new aws.S3();

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const fileName = req.body.fileName;
    const fileType = req.body.fileType;

    const s3Params = {
      Bucket: S3_BUCKET,
      Key: fileName,
      Expires: 500,
      ContentType: fileType
    };
    s3.getSignedUrl("putObject", s3Params, (err, data) => {
      if (err) {
        console.log(err);
        res.json({ success: false, error: err });
        return;
      }
      // Data payload of what we are sending back, the url of the signedRequest and a URL where we can access the content after its saved.
      const returnData = {
        signedRequest: data,
        url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
      };
      // Send it all back
      res.json({ success: true, data: { returnData } });
    });
  })
);

/**
 * Use to get default photo from s3 default-stock folder
 * @route GET /Uploads
 * @returns {object} 200 - An array of default photo
 */
router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    const s3Params = {
      Bucket: S3_BUCKET,
      Prefix: "default-stock/"
    };

    s3.listObjects(s3Params, (error, data) => {
      if (error) {
        console.log(error);
      }
      const returnData = [];
      data.Contents.map(image => {
        if (image.Size > 0) {
          returnData.push({
            image: `https://${S3_BUCKET}.s3.amazonaws.com/${image.Key}`
          });
        }
      });
      res.status(200).json(returnData);
    });
  })
);

/**
 * Returns the default photo url for a given category
 * @route GET /uploads/category-image
 * @param {string} category.query.required - the category to retrieve a url for
 * @returns {object} 200 - An array of default photo
 */
router.get(
  "/category-image",
  auth,
  asyncHandler(async (req, res) => {
    if (!req.query || !req.query.category)
      throw createError(400, "Category is required");
    const url = await Categories.findOne({ swaggie: req.query.category });
    res.status(200).json(url);
  })
);
module.exports = router;
