const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const NotificationSchema = new mongoose.Schema({
    //right now we have: "friend_request", "friend_accepted", "session_invite", "namespace_invite"
    type: String,
    trigger: { type: ObjectId, ref: 'User' },
    //some special thing we wanna say?
    extra: String,
    extra2: String
});

module.exports = {
    Notification: mongoose.model("Notification", NotificationSchema),
    NotificationSchema
}
