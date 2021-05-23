const express = require("express");
const router = express.Router();
const asyncHandler = require("express-async-handler");
const createError = require("http-errors");
const util = require("util");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const auth = require("../../middleware/authentication");
const app = express();


// app.use('/assets', express.static(path.join(__dirname,"assets")));

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
	  cb(null, '/mnt/images/');
  },
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  }
});

const uploadFile = multer({storage}).single('File');

router.post("/", uploadFile, (req, res, next) => {
  if (!req.file) {
    res.json({ success: false, error: "Error Uploading Image!!" });
    return;
  }
  // Data payload of what we are sending back, the url of the signedRequest and a URL where we can access the content after its saved.
  const returnData = {
    url: 'https://images.swaggie.co/' + req.file.filename
  };
  // Send it all back
  res.json({ success: true, data: { returnData } });
});


router.get(
  "/",
  auth,
  asyncHandler(async (req, res) => {
    // const directoryPath = __dirname + "/assets/";
    const newDir = '/mnt/images/default-stock';

      fs.readdir(newDir, function (err, files) {
        if (err) {
          res.status(500).send({
            message: "Unable to scan files!",
          });
        }

        let fileInfos = [];

        files && files.forEach((file) => {
          fileInfos.push({
            name: file,
            image: 'https://images.swaggie.co/default-stock/' + file,
          });
        });

        res.status(200).send(fileInfos);
      });
  })
);



module.exports = router;