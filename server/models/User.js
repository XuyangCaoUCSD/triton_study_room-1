const mongoose = require('mongoose');
// var passportLocalMongoose = require("passport-local-mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new mongoose.Schema({
	username: String,
	password: String,
	googleId: String,
	email: String,
	namespaces: [{type: ObjectId, ref: 'Namespace'}]
});

// // Add methods for passport to User when creating model
// UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);