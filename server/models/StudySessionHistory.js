const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

// an invited person and his/her reaction to this coming study session
const ReactionSchema = new mongoose.Schema({
    // this String storing the person's email
    person: String,
    name: String,
    // reaction can have: accept, reject, wait_response, creator
    reaction: String,
    avatar: String
});

const Reaction = mongoose.model("Reaction", ReactionSchema);

const StudySessionHistorySchema = new mongoose.Schema({
    participants: [ReactionSchema],
    // is String the best data type?
    start: Date,
    end: Date,
    location: String,
    title: String,
    desc: String
});

module.exports = {
    StudySessionHistory: mongoose.model("StudySessionHistory", StudySessionHistorySchema),
    StudySessionHistorySchema,
    ReactionSchema,
    Reaction
}
