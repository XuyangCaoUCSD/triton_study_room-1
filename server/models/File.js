const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const FileSchema = new mongoose.Schema({
    files: [
        {
            originalName: String,
            url: String
        }
    ],
    forNamespace: String
}, {
    timestamps: true
});

module.exports = {
    File: mongoose.model("File", FileSchema),
    FileSchema
}