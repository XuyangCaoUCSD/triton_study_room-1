const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.ObjectId;

const ChatHistory = new mongoose.Schema({
    messages: [{
        content: String,
        time: Date,
        creator: ObjectId
    }]
});

module.exports = mongoose.model("ChatHistory", ChatHistory);