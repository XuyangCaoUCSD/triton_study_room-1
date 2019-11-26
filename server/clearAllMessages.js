const mongoose = require('mongoose');
const { ChatHistory } = require('./models/ChatHistory');
const User = require('./models/User');
mongoose.connect("mongodb://localhost:27017/triton_study_room", {useNewUrlParser: true, useUnifiedTopology: true});

ChatHistory.find({}).then((allChatHistories) => {
    allChatHistories.forEach((history) => {
        history.messages = [];
        history.save().then((savedHistory) => {
            console.log('Cleared messages for ' + savedHistory.id);
        }).catch((err) => {
            console.log(err);
        })
    })
}).catch((err) => {
    console.log(err);
});