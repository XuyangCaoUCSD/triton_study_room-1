const  express       = require('express'),
       User          = require('../models/User'),
       Namespace     = require('../models/Namespace'),
       { Calendar }  = require('../models/Calendar'),
       middleware    = require('../middleware/index');

var router = express.Router();


// /calendar route. Retrieve user's calendar events
router.get('/', middleware.isLoggedIn, (req, res) => {
    let userId = req.session.passport.user;
    console.log("Reached calendar get route");

    let data = {
        success: true
    }

    User.findById(userId).then((foundUser) => {

        // If no calendar, create new
        if (!foundUser.calendar) {
            Calendar.create({
                events: []
            }).then((createdCalendar) => {
                User.findByIdAndUpdate(
                    userId,
                    {$set: {calendar: createdCalendar.id}},
                    {safe: true, new: true}
                ).then((updatedUser) => {
                    console.log('Added calendar field to user');
                    data.events = createdCalendar.events;
                    res.send(data);
                }).catch((err) => {
                    console.log(err);
                });

            }).catch((err) => {
                console.log(err);
            });

        } else {
            // If existing calendar, return existing events

            Calendar.findById(foundUser.calendar).then((foundCalendar) => {
                data.events = foundCalendar.events;
                res.send(data);
            }).catch((err) => {
                console.log(err);
            });

        }


    }).catch((err) => {
        console.log(err);
    });
   
});


router.patch('/', middleware.isLoggedIn, (req, res) => {
    let userId = req.session.passport.user;
    let patchType = req.body.patchType;
    let calendarEvent = req.body.calendarEvent;

    console.log("Reached calendar patch route");

    console.log('patchType is ' + patchType);
    console.log('calendarEvent is ');
    console.log(calendarEvent);

    let data = {
        success: true
    }

    User.findById(userId).then((foundUser) => {
        // Determine what type of pathc
        if (patchType === 'add') {

            if (!req.body.calendarEvent) {
                data.success = false;
                data.errorMessage = 'Need an event to add!';
                res.send(data);
                return;
            }

            Calendar.findByIdAndUpdate(
                foundUser.calendar,
                {$push: {events: calendarEvent}},
                {safe: true, new: true}
            ).then((updatedCalendar) => {
                console.log('Added event to calendar object');
                let newEvent = updatedCalendar.events[updatedCalendar.events.length - 1];
                // Need access to _id
                data.newEvent = newEvent;
               
                res.send(data);

            }).catch((err) => {
                console.log(err);
            });

        } else if (patchType === 'remove') {

            Calendar.findByIdAndUpdate(
                foundUser.calendar,
                {$pull: {events: calendarEvent}},
                {safe: true, new: true}
            ).then((updatedCalendar) => {
                console.log('Removed event from calendar');
                res.send(data);
            }).catch((err) => {
                console.log(err);
            });

        } else if (patchType === 'modify') {

            Calendar.findById(
                foundUser.calendar
            ).then((foundCalendar) => {
                let foundIndex = -1;
                let events = foundCalendar.events;
                // Find event to modify
                for (var i = 0; i < events.length; ++i) {
                    if (events[i].id == calendarEvent._id) {
                        foundIndex = i;
                        break;
                    } 
                }

                if (foundIndex === -1) {
                    data.success = false;
                    console.log('Could not find event to modify');
                    data.errorMessage = 'Could not find event to modify';
                    res.send(data);
                    return;
                }

                // events[foundIndex] = calendarEvent;

                Calendar.updateOne(
                    {"_id": foundCalendar.id, "events._id": calendarEvent._id},
                    {
                        "$set": 
                            {
                                "events.$.title": calendarEvent.title, 
                                "events.$.start": calendarEvent.start, 
                                "events.$.end": calendarEvent.end,
                                "events.$.desc": calendarEvent.desc
                            },
                    }
                ).then((doc) => {
                    console.log('Successfully modified calendar event');
                    console.log(doc);
                    data.modifiedEvent = calendarEvent; // pass back the item passed in api call
                    res.send(data);
                    
                }).catch((err) => {
                    console.log(err);
                });

            }).catch((err) => {
                console.log(err);
            });

        } else {
            console.log('Invalid patchType');
            data.success = false;
            data.errorMessage = 'Invalid patchType';
            res.send(data);
            return;
        }
        


    }).catch((err) => {
        console.log(err);
    });


});

module.exports = router;