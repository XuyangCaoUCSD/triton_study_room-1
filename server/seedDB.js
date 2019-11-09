//////////
// Seeding once

const mongoose = require('mongoose');
const Namespace = require('./models/Namespace');
mongoose.connect("mongodb://localhost:27017/triton_study_room", {useNewUrlParser: true, useUnifiedTopology: true});

// Only create if not existing

Namespace.findOne({nsId: 0})
.then((found) => {
    if (!found) {
        Namespace.create({
            nsId: 0,
            groupName: 'cse110',
            img: 'https://i.ytimg.com/vi/O753uuutqH8/maxresdefault.jpg',
            endpoint: '/cse110',
            rooms: [
                {roomId: 0, roomName: 'General', chatHistory: ['Hello', 'Hi there buddy', 'Lorem Ipsum']},
                {roomId: 1, roomName: 'Labs', chatHistory: ['Hello']},
                {roomId: 2, roomName: 'Other', chatHistory: ['Hi']},
            ],
            people: [
                "5dad7929adc05b195802bc34"
            ]
        }).then((created) => {
            console.log(created);
        }).catch((err) => {
            console.log(err);
        });
        
        Namespace.create({
            nsId: 1,
            groupName: 'cse100',
            img: 'https://cecieee.org/wp-content/uploads/2018/11/data-structure.jpg',
            endpoint: '/cse100',
            rooms: [
                {roomId: 0, roomName: 'General', chatHistory: ['HALLOW', 'HI HO', 'PIGGY']},
            ], 
            people: [
                "5dad7929adc05b195802bc34"
            ]
        });
        
        Namespace.create({
            nsId: 2,
            groupName: 'cse101',
            img: 'https://i.ytimg.com/vi/rL8X2mlNHPM/maxresdefault.jpg',
            endpoint: '/cse101',
            rooms: [
                {roomId: 0, roomName: 'General', chatHistory: ['FADSAFDS', 'EAT LUNCH NOW']},
            ],
            people: [
                "5dad7929adc05b195802bc34"
            ]
        });
    }
})

/////////
