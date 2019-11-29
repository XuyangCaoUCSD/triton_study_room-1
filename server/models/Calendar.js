const mongoose = require('mongoose');

//schema for event (embedded in calendar_info)
const EventSchema = new mongoose.Schema({
    title: String,
    start: Date,
    end: Date,
    location: String,
    visibility: String
});


//schema for an user's calendar (embedded in user)
const CalendarSchema = new mongoose.Schema({
    events: [EventSchema],
});

//export the calendar schema so that it can be used in user schema
//also we can export eventSchema for user to add events
module.exports = {
    Calendar: mongoose.model("Calendar", CalendarSchema),
    CalendarSchema,
    EventSchema
}
