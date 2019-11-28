const mongoose = require('mongoose');
// var passportLocalMongoose = require("passport-local-mongoose");

//import the calendar schema
const { CalendarSchema } = require("./Calendar");
const { NotificationSchema } = require("./Notification");

const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new mongoose.Schema({
	name: String,
	givenName: String,
	familyName: String,
	avatar: { type: String, default: 'http://localhost:8181/api/uploads/avatars/DEFAULT_USER_123.png' }, // TODO CHANGE LOCALHOST
	googleId: String,
	email: String,
	friends: [ { type: ObjectId, ref: 'User' } ],
	namespaces: [ { type: ObjectId, ref: 'Namespace' } ],
	//the followings are added fields
	major: String,
	aboutMe: String,
	phone: String,
	newUser: { type: Boolean, default: true },
	classes: [ { type: ObjectId, ref: 'Class' } ],
	request_notification: [NotificationSchema],
	calendar: { type: Object, ref: 'Calendar' }
});

// // Add methods for passport to User when creating model
// UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
