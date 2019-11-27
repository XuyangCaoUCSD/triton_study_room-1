const mongoose = require('mongoose');
// var passportLocalMongoose = require("passport-local-mongoose");

const ObjectId = mongoose.Schema.Types.ObjectId;

//schema for event (embedded in calendar_info)
const EventSchema = new mongoose.Schema({
  eventName: String,
  startTime: Date,
  endTime: Date,
  location: String,
  visibility: String
});


//schema for an user's calendar (embedded in user)
const CalendarSchema = new mongoose.Schema({
    mon: [EventSchema],
    tue: [EventSchema],
    wed: [EventSchema],
    thur: [EventSchema],
    fri: [EventSchema],
    sat: [EventSchema],
    sun: [EventSchema]
});

//export the calendar schema so that it can be used in user schema
//also we can export eventSchema for user to add events
module.exports = {
    Calendar: mongoose.model("Calendar", CalendarSchema),
    CalendarSchema,
    EventSchema
}
