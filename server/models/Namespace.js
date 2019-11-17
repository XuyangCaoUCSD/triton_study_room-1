const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const NamespaceSchema = new mongoose.Schema({
    groupName: String,
    img: String,
    nsId: Number,
    endpoint: String,
    admins: [{type: ObjectId, ref: 'User'}],
    people: [{type: ObjectId, ref: 'User'}],
    forClass: ObjectId,
    rooms: [
                { 
                    roomId: Number,
                    roomName: String,
                    chatHistory: {type: ObjectId, ref: 'ChatHistory'}
                }
    ],
    studySessionsHistory: [{type: ObjectId, ref: 'StudySessionHistory'}]
}, {
    timestamps: true
});

module.exports = mongoose.model("Namespace", NamespaceSchema);