Date.prototype.toLocalISOString = function() {
    return DibsRoomHours.toLocalISOString( this.getFullYear(), this.getMonth() + 1, this.getDate(), this.getHours(), this.getMinutes(), this.getSeconds() );
};

/**
 * Defines a block of time of either a reservation or the general open hours of a room in the D!BS system
 */
class DibsRoomHours {

    room;
    start;
    end;

    /**
     * Creates an ISO string in "YYYY-MM-DDTHH:MM:SS" UTC-0800 for the given parameters
     * @param year
     * @param month
     * @param day
     * @param hour
     * @param minute
     * @param second
     * @returns {string}
     */
    static toLocalISOString( year, month, day, hour, minute, second ) {
        return year + "-" + ( month > 9 ? month : "0" + month ) + "-" + ( day > 9 ? day : "0" + day ) + "T" + ( hour > 9 ? hour : "0" + hour ) + ":" + ( minute > 9 ? minute : "0" + minute ) + ":" + ( second > 9 ? second : "0" + second );
    }

    /**
     * Inverts a selection of room hours between start and end
     * @param room The room for which hours will be generated
     * @param start The Date representing the start of the whole interval
     * @param end The Date representing the end of the whole interval
     * @param intervals The DibsRoomHours representing events in the time interval
     * @returns {DibsRoomHours[]}
     */
    static invertRoomHours( room, start, end, intervals ) {

        if( end < start ) return [];
        if( intervals.length === 0 ) return [];

        let nextBlockStart;
        let nextBlockEnd;
        let invertedHours = [];

        //iterate over all the open hours and take the inverse time slots
        nextBlockStart = start; //start at beginning of day
        for( let i = 0; i < intervals.length; i++ ) {

            let nextEvent = intervals[i];
            nextBlockEnd = nextEvent.getStartDate();

            if( nextBlockStart < nextBlockEnd )
                invertedHours.push( new this( room, nextBlockStart.toLocalISOString(), nextBlockEnd.toLocalISOString() ) );

            nextBlockStart = nextEvent.getEndDate();

        }

        //finish at the end of the day, or rather the beginning of the next day
        nextBlockEnd = end;
        if( nextBlockStart < nextBlockEnd )
            invertedHours.push( new this( room, nextBlockStart.toLocalISOString(), nextBlockEnd.toLocalISOString() ) );

        return invertedHours;
    }

    /**
     * A block of time for a room in the D!BS system
     * @param room The room for which this time is specified
     * @param start The start date and time of the block, taking the format
     *        "YYYY-MM-DDTHH:MM:SS" UTC-0800
     * @param end The end date and time of the block, taking the format
     *        "YYYY-MM-DDTHH:MM:SS" UTC-0800
     */
    constructor( room, start, end ) {
        this.room = room;
        this.start = start;
        this.end = end;
    }

    /**
     * The room for which this block of time is defined
     * @returns {string}
     */
    getRoom() {
        return this.room;
    }

    /**
     * The start date and time in "YYYY-MM-DDTHH:MM:SS" UTC-0800
     * @returns {string}
     */
    getStart() {
        return this.start;
    }

    /**
     * The start date and time as a Date object
     * @returns {Date}
     */
    getStartDate() {
        return new Date( this.start );
    }

    /**
     * The end date and time in "YYYY-MM-DDTHH:MM:SS" UTC-0800
     * @returns {string}
     */
    getEnd() {
        return this.end;
    }

    /**
     * The end date and time as a Date object
     * @returns {Date}
     */
    getEndDate() {
        return new Date( this.end );
    }

    /**
     * The duration of the room hour, from the start time, in units of hours
     * @returns {number}
     */
    getDuration() {
        const MS_PER_HOUR = 1000 * 60 * 60;
       return ( this.getEndDate() - this.getStartDate() ) / MS_PER_HOUR;
    }
}

module.exports = DibsRoomHours;