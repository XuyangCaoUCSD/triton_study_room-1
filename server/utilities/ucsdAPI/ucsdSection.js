/**
 * Details about a section
 */
class UCSDSection {

    section;
    section_code;
    meeting_type;
    date;
    time;
    days;
    building;
    room;
    instructor_name;
    special_mtg_code;
    enrollStatus;

    /**
     * Generates a UCSD Section object from the given JSON data
     * @param data JSON data fetched from the AcademicHistory API
     * @returns {UCSDSection}
     */
    static fromJSON( data ) {

        let sec = new UCSDSection();
        sec.section = data.section;
        sec.section_code = data.section_code;
        sec.meeting_type = data.meeting_type;
        sec.date = data.date;
        sec.time = data.time;
        sec.days = data.days;
        sec.building = data.building;
        sec.room = data.room;
        sec.instructor_name = data.instructor_name;
        sec.special_mtg_code = data.special_mtg_code;
        sec.enrollStatus = data.enrollStatus;

        return sec;
    }

    /**
     * The section number for this section. This is the proper section code.
     * i.e. 995120
     * @returns {string}
     */
    getSection() {
        return this.section;
    }

    /**
     * The section *code* for this section. This is the common section code.
     * i.e. A01
     * @returns {string}
     */
    getSectionCode() {
        return this.section_code;
    }

    /**
     * The meeting type for this section.
     * i.e. Discussion, Lecture
     * @returns {string}
     */
    getMeetingType() {
        return this.meeting_type;
    }

    /**
     * The specific date this section meets, if defined, otherwise null
     * This will be in ISO, UTC-0800
     * @returns {string}
     */
    getDate() {
        return this.date;
    }

    /**
     * The meeting time for this section
     * This will be in "HH:MM - HH:MM"
     * @returns {string}
     */
    getTime() {
        return this.time;
    }

    /**
     * The *day* this section meets
     * This one is odd in that meeting times are split by days, so that even
     * if this section meets on the same time and location on TU and TH, for example,
     * each day will get its own section specification. This is probably done for
     * quick rendering on a calendar.
     * i.e. M TU W TH F S SU
     * @returns {string}
     */
    getDays() {
        return this.days;
    }

    /**
     * The building name where the section meets
     * @returns {string}
     */
    getBuilding() {
        return this.building;
    }

    /**
     * The room in the building where the section meets
     * @returns {string}
     */
    getRoom() {
        return this.room;
    }

    /**
     * The name of the instructor for this section
     * @returns {string}
     */
    getInstructorName() {
        return this.instructor_name;
    }

    /**
     * A special meeting code, given to pertinent events like finals
     * i.e. FI for final
     * @returns {string}
     */
    getSpecialMeetingCode() {
        return this.special_mtg_code;
    }

    /**
     * The enrollment status of this section, empty if not enrolled
     * i.e. EN or WL
     * @returns {string}
     */
    getEnrollmentStatus() {
        return this.enrollStatus;
    }

}

module.exports = UCSDSection;