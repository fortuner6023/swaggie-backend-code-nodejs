const mongoose = require("mongoose");

module.exports = async uri => {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to database", uri);
  } catch (e) {
    console.log("Error, unable to connect to database");
    console.log(e);
  }
};
 