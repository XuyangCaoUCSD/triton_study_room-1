const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const MessageSchema = new mongoose.Schema({
    content: String,
    creatorName: String,
    creatorAvatar: String,
    time: { type : Date, default: Date.now },
    creator: { type: ObjectId, ref: 'User' }
});


module.exports = {
    Message: mongoose.model("Message", MessageSchema), // Message model
    MessageSchema: MessageSchema
}


        