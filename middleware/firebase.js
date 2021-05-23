const firebase = require("firebase/app");
const firebaseAccount = require("../api-Routes/users/firebase.json");
require("firebase/auth");
require("firebase/firestore");

firebase.initializeApp(firebaseAccount);

module.exports = firebase;
