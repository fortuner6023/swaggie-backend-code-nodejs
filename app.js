require("dotenv").config();
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const cors = require("cors");
const { errorHandler, route404Handler } = require("./middleware/errorHandler");
const apiRouter = require("./api-Routes/index");
const connect = require("./db");
const app = express();
const expressSwagger = require("express-swagger-generator")(app);
const xmlparser = require("express-xml-bodyparser");
const CronJob = require("cron").CronJob;
const https = require("https");
const fs = require("fs");
const unzipper = require("unzipper");
const xml2js = require("xml2js");
const axios = require("axios");
const createError = require("http-errors");

const xml2jsDefaults = {
  explicitArray: true,
  normalize: true,
  normalizeTags: true,
  trim: true
};
app.use(logger("dev"));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(xmlparser(xml2jsDefaults));
app.disable("etag");
// Setup swagger api
expressSwagger({
  swaggerDefinition: {
    info: {
      description: "Swaggie API server",
      title: "Swagger",
      version: "1.0.0"
    },
    host: process.env.CALLBACK_URL,
    basePath: "/api",
    produces: ["application/json"],
    schemes: ["http", "https"],
    securityDefinitions: {
      JWT: {
        type: "apiKey",
        in: "header",
        name: "Authorization",
        description: ""
      }
    }
  },
  basedir: __dirname, //app absolute path
  files: ["./features/**/*.js"] //Path to the API handle folder
});

// Route definitions
app.use("/api", apiRouter);

// Error handling
app.use(route404Handler);
app.use(errorHandler);
// connect(process.env.MONGO_URI )
// console.log("MongoUrl",process.env.MONGO_URI);


if (process.env.CRON_SERVER == 1) {
  console.log("****************CRON SERVER****************");
  var job = new CronJob('0 18,2 * * *', function() {
    if (process.env.CRON_SERVER != 1) {
      console.log("###########THIS IS NOT A CRON SERVER. RETURNING.###########");
      return;
    }
    console.log("Starting jobg8 download cron");
    const JOBG8_URL = "https://www.jobg8.com/fileserver/jobs.aspx?username=jobg8swaggie.co&password=dn8Fq47vdBJ9KGB&accountnumber=819142&filename=Jobs.zip";

    const file = fs.createWriteStream("Jobs.zip");
    https.get(JOBG8_URL, function(response) {
      console.log("download started");
      response.pipe(file);
    });
    file.on("finish", function() {
      file.close(() => {
        console.log("download completed");
        unzipFile("Jobs.zip", async () => {
          const xml = fs.readFileSync(
            `Jobs.xml`,
            "utf8"
          );
          let parsedJobs = [];

          xml2js.parseString(xml, function(err, result) {
            parsedJobs = result.Jobs;
          });

          if (parsedJobs && parsedJobs.Job && parsedJobs.Job.length) {
            let isErr = false;

            sendMail("Cron Job started with " + parsedJobs.Job.length + " jobs");
            for (let i = 0; i < parsedJobs.Job.length; i++) {
              if (isErr) {
                break;
              }
              console.log("Saving job: ", i);
              // Send the JSON string Job to localhost
              let data = { Job: JSON.stringify(parsedJobs.Job[i]) };
              // if (i == 0) {
              //   data.Clean = "1";
              // }
              await axios.post("https://api.swaggie.co/api/jobs/jobG8", data, {
                headers: {
                  "Content-Type": "application/json"
                },
                auth: {
                  username: "jobg8@swaggie.co",
                  password: "dn8Fq47vdBJ9KGB"
                }
              }).catch((errors) => {
                isErr = true;
                sendMail("Cron Job Failed with error: " + errors);
                throw createError(400, {
                  message: "Cron Job Failed",
                  errors: errors.errors
                });
              });
            }
            console.log("ALLL JOBS ADDED!!!!!!!!!!!!!");
            if (!isErr) {
              await axios.post("https://api.swaggie.co/api/jobs/removeJobG8",null ,{
                headers: {
                  "Content-Type": "application/json"
                },
                auth: {
                  username: "jobg8@swaggie.co",
                  password: "dn8Fq47vdBJ9KGB"
                }
              }).catch((errors) => {
                sendMail("Cron Job Failed with error: " + errors);
                // createError(400, {
                //   message: "Cron Job Failed",
                //   errors: errors.errors
                // });
              });
            }
          } 
        }); 
      });
    });
  }, null, true);
  job.start();
}

async function sendMail(msg) {
  await axios.post(
    process.env.MAILJET_URL,
    {
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_SENDER,
            Name: "Swaggie"
          },
          To: [
            {
              Email: "vishal.solanki@qsstechnosoft.com"
            }
          ],
          Cc: [
            // {
            //   Email: "shashank.lohani@qsstechnosoft.com"
            // },
            // {
            //   Email: "pankaj@qsstechnosoft.com"
            // },
            // {
            //   Email: "devesh.naswa@qsstechnosoft.com"
            // }
          ],
          Subject: "Cron Job Status",
          // Textpart: { msg },
          HTMLPart: `<h3>` + msg + `</h3>`
        }
      ]
    },
    {
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${process.env.MAILJET_KEY}:${process.env.MAILJET_SECRET}`,
          "utf8"
        ).toString("base64")}`
      }
    }
  ).catch(error => {
    throw createError(400, {
      message: "Sending Mail Failed",
      error
    });
  });
}

module.exports = app;
