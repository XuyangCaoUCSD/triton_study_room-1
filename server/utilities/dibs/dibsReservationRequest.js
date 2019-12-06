/**
 * Defines a reservation to make on the D!BS system
 */
class DibsReservationRequest {

    room;
    startDate;
    duration;
    firstName;
    lastName;
    phoneNumber;
    email;

    /**
     * Creates the reservation request.
     * @param room The DibsRoom in which to make the reservation.
     * @param startDate A Date representing the start of the reservation
     * @param duration The length of the reservation, which may be in increments of 0.5 hours, no more than 3
     * @param firstName The first name of the contact
     * @param lastName The last name of the contact
     * @param phoneNumber The phone number of the contact
     * @param email The email of the contact
     */
    constructor( room, startDate, duration, firstName, lastName, phoneNumber, email ) {
        this.room = room;
        this.firstName = firstName;
        this.lastName = lastName;
        this.phoneNumber = phoneNumber;
        this.email = email;
        this.startDate = startDate;
        this.duration = Math.round( duration / 0.5 ) * 0.5;
    }

    /**
     * The room in which the reservation is made
     * @returns {room}
     */
    getRoom() {
        return this.room;
    }

    /**
     * The first name of the contact
     * @returns {string}
     */
    getFirstName() {
        return this.firstName;
    }

    /**
     * The last name of the contact
     * @returns {string}
     */
    getLastName() {
        return this.lastName;
    }

    /**
     * The email of the contact
     * @returns {string}
     */
    getEmail() {
        return this.email;
    }

    /**
     * The phone number of the contact, in the format (XXX) XXX-XXXX
     * @returns {string}
     */
    getPhoneNumber() {
        return this.phoneNumber;
    }

    /**
     * The start date of the reservation
     * @returns {Date}
     */
    getStartDate() {
        return this.startDate;
    }

    /**
     * The end date of the reservation
     * @returns {Date}
     */
    getEndDate() {
        let endDate = new Date( this.startDate );
        //milliseconds per hour = 60 * 60 * 1000
        endDate.setTime( endDate.getTime() + ( 60 * 60 * 1000 * this.duration ) );
        return endDate;
    }

    /**
     * The duration of the reservation, in increments of 0.5 no more than 3.0
     * @returns {number}
     */
    getDuration() {
        return this.duration;
    }

    /**
     * Creates a JSON object that can be sent to the D!BS system
     * @returns {{firstName: string, lastName: string, emailAddress: string, reservationLength: number, phoneNumber: string, roomid: number, startDate: string}}
     */
    toJSON() {
        return {
            firstName: this.firstName,
            lastName: this.lastName,
            roomid: this.room.getID(),
            startDate: this.startDate.toLocalISOString(),
            reservationLength: this.duration,
            phoneNumber: this.phoneNumber,
            emailAddress: this.email,
            cardNumber: "",
            langCode: "en-US",
            staffAccess: false
        }
    }
}

module.exports = DibsReservationRequest;