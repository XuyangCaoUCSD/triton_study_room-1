const mongoose = require('mongoose');
// var passportLocalMongoose = require("passport-local-mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new mongoose.Schema({
	name: String,
	givenName: String,
	familyName: String,
	avatar: { type: String, default: 'https://cdn5.vectorstock.com/i/1000x1000/51/99/icon-of-user-avatar-for-web-site-or-mobile-app-vector-3125199.jpg' },
	googleId: String,
	email: String,
	namespaces: [ { type: ObjectId, ref: 'Namespace' } ]
});

// // Add methods for passport to User when creating model
// UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);