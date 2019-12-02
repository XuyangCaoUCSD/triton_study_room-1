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
     * @param startDate The start date of the reservation, which takes the format
     *        "YYYY-MM-DDTHH:MM:SS" UTC-0800
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
        this.duration = duration;
    }

    /**
     * The room in which the reservation is made
     * @returns {*}
     */
    getRoom() {
        return this.room;
    }

    /**
     * The first name of the contact
     * @returns {*}
     */
    getFirstName() {
        return this.firstName;
    }

    /**
     * The last name of the contact
     * @returns {*}
     */
    getLastName() {
        return this.lastName;
    }

    /**
     * The email of the contact
     * @returns {*}
     */
    getEmail() {
        return this.email;
    }

    /**
     * The phone number of the contact, in the format (XXX) XXX-XXXX
     * @returns {*}
     */
    getPhoneNumber() {
        return this.phoneNumber;
    }

    /**
     * The start date of the reservation, in the format "YYYY-MM-DDTHH:MM:SS" UTC-0800
     * @returns {*}
     */
    getStartDate() {
        return this.startDate;
    }

    /**
     * The duration of the reservation, in increments of 0.5 no more than 3.0
     * @returns {*}
     */
    getDuration() {
        return this.duration;
    }

    /**
     * Creates a JSON object that can be sent to the D!BS system
     * @returns {{firstName: *, lastName: *, emailAddress: *, reservationLength: *, phoneNumber: *, staffAccess: boolean, langCode: string, roomid: *, startDate: *, cardNumber: string}}
     */
    toJSON() {
        return {
            firstName: this.firstName,
            lastName: this.lastName,
            roomid: this.room.getID(),
            startDate: this.startDate,
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