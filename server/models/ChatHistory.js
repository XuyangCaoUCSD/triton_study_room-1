const mongoose = require('mongoose');

const { MessageSchema } = require('./Message');

const ObjectId = mongoose.Schema.Types.ObjectId;

const ChatHistorySchema = new mongoose.Schema({
    messages: [MessageSchema]
}, {
    timestamps: true
});

module.exports = {
    ChatHistory: mongoose.model("ChatHistory", ChatHistorySchema),
    ChatHistorySchema
}