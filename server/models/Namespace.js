const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const NamespaceSchema = new mongoose.Schema({
    groupName: String,
    img: String,
    nsId: Number,
    endpoint: String,
    admins: [ { type: ObjectId, ref: 'User' } ],
    people: [ { type: ObjectId, ref: 'User' } ],
    forClass: ObjectId,
    privateChat: { type: Boolean, default: false },
    privateGroup: { type: Boolean, default: false },
    rooms: [
                { 
                    roomId: Number,
                    roomName: String,
                    chatHistory: { type: ObjectId, ref: 'ChatHistory' }
                }
    ],
    peopleDetails: [{ 
        email: String,
        givenName: String,
        name: String,
        avatar: String
    }],
    files: { type: ObjectId, ref: 'File' },
    studySessionsHistory: [ { type: ObjectId, ref: 'StudySessionHistory' } ]
}, {
    timestamps: true
});

module.exports = mongoose.model("Namespace", NamespaceSchema);