//////////
// Seeding once

const mongoose = require('mongoose');
const Namespace = require('./models/Namespace');
const { ChatHistory } = require('./models/ChatHistory');
mongoose.connect("mongodb://localhost:27017/triton_study_room", {useNewUrlParser: true, useUnifiedTopology: true});

// Only create if not existing

// ChatHistory.create({
//     messages: []
// }).then((created) => {
//     console.log('created chat history');
// }).catch((err) => {
//     console.log(err);
// });


Namespace.findOne({nsId: 0})
.then((found) => {
    if (!found) {
        Namespace.create({
            nsId: 0,
            groupName: 'CSE 110',
            img: 'https://i.ytimg.com/vi/O753uuutqH8/maxresdefault.jpg',
            endpoint: '/cse110',
            rooms: [
                {roomId: 0, roomName: 'General', chatHistory: "5de4827341752f1450d2d7b3"},
                {roomId: 1, roomName: 'Labs', chatHistory: "5de48276f5cd84145c30461c"}, 
                {roomId: 2, roomName: 'Other', chatHistory: "5de4827913cc6c1468473382"},
            ],
            people: [
                "5dce566f859c4781ccc9757c"
            ]
        }).then((created) => {
            console.log(created);
        }).catch((err) => {
            console.log(err);
        });

        
        Namespace.create({
            nsId: 1,
            groupName: 'CSE 100',
            img: 'https://cecieee.org/wp-content/uploads/2018/11/data-structure.jpg',
            endpoint: '/cse100',
            rooms: [
                {roomId: 0, roomName: 'General', chatHistory: "5de4827ccabbc91474e344ed"},
            ], 
            people: [
                "5dce566f859c4781ccc9757c"
            ]
        });
        
        Namespace.create({
            nsId: 2,
            groupName: 'CSE 101',
            img: 'https://i.ytimg.com/vi/rL8X2mlNHPM/maxresdefault.jpg',
            endpoint: '/cse101',
            rooms: [
                {roomId: 0, roomName: 'General', chatHistory: "5de482806086df14806ba561"},
            ],
            people: [
                "5dce566f859c4781ccc9757c"
            ]
        });
    }
})

/////////
