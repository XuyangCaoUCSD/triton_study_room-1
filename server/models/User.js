const mongoose = require('mongoose');
// var passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = new mongoose.Schema({
	username: String,
	password: String,
	googleId: String,
	email: String,
});

// // Add methods for passport to User when creating model
// UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);