const  express       = require('express'),
       User          = require('../models/User'),
       { Calendar }  = require('../models/Calendar'),
       middleware    = require('../middleware/index');

const findFreeIntervals = require('../utilities/schedule-matching');
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

router.post('/shedule-matching', middleware.isLoggedIn, (req, res) => {
    let userId = req.session.passport.user;
    let users = req.body.users;

    let data = {
        success: true
    };
 

    User.findById(userId).then(async function(selfInfo) {
       
        // First include creator's calendar id
        let calendarIds = [selfInfo.calendar];

        // Get all calendar ids of people involved
        for (var i = 0; i < users.length; i++) {
            let currUser = users[i];
            let calendarId = await User.findOne({
                email: currUser.email
            }).then((foundCurrUser) => {
                if (!foundCurrUser) {
                    return "error";
                }
                
                return foundCurrUser.calendar;
            }).catch((err) => {
                return "error";
                console.log(err);
            });

            if (calendarId === "error") {
                console.log('Error finding user details skipping for now');
                continue;
            }

            calendarIds.push(calendarId);
        }

        console.log('calendarIds are ');
        console.log(calendarIds);

        let allEventIntervals = [];
        
        // Get all events from people involved
        for (var calIdsIdx = 0; calIdsIdx < calendarIds.length; calIdsIdx++) {
            var currEvents = await Calendar.findById(
                calendarIds[calIdsIdx]
            ).then((foundCalendar) => {
                // Even empty array in javascript is truthy, so this null check is ok
                if (!foundCalendar) {
                    return "error";
                }
                return foundCalendar.events;
            }).catch((err) => {
                console.log(err);
                return "errror";
            });

            if (currEvents === "error") {
                console.log('Error finding user details skipping for now');
                continue;
            }

            let eventIntervals = currEvents.map((event) => {
                return [new Date(event.start), new Date(event.end)];
            })

            allEventIntervals = allEventIntervals.concat(eventIntervals);
        }

        console.log('allEventIntervals are');
        console.log(allEventIntervals);


        let freeIntervals = findFreeIntervals(allEventIntervals);
        console.log('Free intervals are');
        console.log(freeIntervals);
       
        data.availableTimes = freeIntervals;
        res.send(data);
       
  
    }).catch(function(err) {
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