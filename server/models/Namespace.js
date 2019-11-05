const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.ObjectId;

const NamespaceSchema = new mongoose.Schema({
    groupName: String,
    img: String,
    endpoint: String,
    admins: [ObjectId],
    people: [ObjectId],
    forClass: ObjectId,
    rooms: [
                { 
                    roomName: String,
                    chatHistory: ObjectId
                }
    ],
    studySessionsHistory: [ObjectId]
}, {
    timestamps: true
});

module.exports = mongoose.model("Namespace", NamespaceSchema);