const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const NamespaceSchema = new mongoose.Schema({
    groupName: String,
    img: String,
    nsId: Number,
    endpoint: String,
    admins: [ObjectId],
    people: [ObjectId],
    forClass: ObjectId,
    rooms: [
                { 
                    roomId: Number,
                    roomName: String,
                    chatHistory: [String]
                }
    ],
    studySessionsHistory: [ObjectId]
}, {
    timestamps: true
});

module.exports = mongoose.model("Namespace", NamespaceSchema);