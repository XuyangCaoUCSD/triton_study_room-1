/**
 * Defines a block of time of either a reservation or the general open hours of a room in the D!BS system
 */
class DibsRoomHours {

    room;
    start;
    end;

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
     * @returns {*}
     */
    getRoom() {
        return this.room;
    }

    /**
     * The start date and time in "YYYY-MM-DDTHH:MM:SS" UTC-0800
     * @returns {*}
     */
    getStart() {
        return this.start;
    }

    /**
     * The end date and time in "YYYY-MM-DDTHH:MM:SS" UTC-0800
     * @returns {*}
     */
    getEnd() {
        return this.end;
    }
}

module.exports = DibsRoomHours;