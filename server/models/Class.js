const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

//for each UCSD class
const ClassSchema = new mongoose.Schema({
    className: String,
    mainNamespace: { type: ObjectId, ref: 'Namespace' }
});

module.exports = mongoose.model("Class", ClassSchema);
