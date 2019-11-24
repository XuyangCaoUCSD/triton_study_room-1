const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

// an invited person and his/her reaction to this coming study session
const ReactionSchema = new mongoose.Schema({
  person: { type: ObjectId, ref: 'User' },
  // reaction can have: accept, reject, wait_response
  reaction: String
});

const StudySessionHistorySchema = new mongoose.Schema({
  participants: [ReactionSchema],
  // is String the best data type?
  date: String,
  startTime: Number,
  endTime: Number,
  location: String
});

module.exports = {
    StudySessionHistory: mongoose.model("StudySessionHistory", StudySessionHistorySchema),
    StudySessionHistorySchema,
    ReactionSchema
}
