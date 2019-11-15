const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.ObjectId;

const MessageSchema = new mongoose.Schema({
    content: String,
    creatorName: String,
    creatorAvatar: String,
    time: { type : Date, default: Date.now },
    creator: [ObjectId]
});


module.exports = {
    Message: mongoose.model("Message", MessageSchema), // Message model
    MessageSchema: MessageSchema
}


        