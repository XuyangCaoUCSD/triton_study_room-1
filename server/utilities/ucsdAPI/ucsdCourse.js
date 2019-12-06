const UCSDSection = require('./ucsdSection.js');

/**
 * Details about a course
 */
class UCSDCourse {

    term_code;
    subject_code;
    course_code;
    units;
    course_level;
    grade_option;
    grade;
    course_title;
    enrollment_status;
    repeat_code;
    section_data;

    /**
     * Generates a UCSD Course object from the given JSON data
     * @param data JSON data fetched from the AcademicHistory API
     * @returns {UCSDCourse}
     */
    static fromJSON( data ) {

        let course = new UCSDCourse();
        course.term_code = data.term_code;
        course.subject_code = data.subject_code;
        course.course_code = data.course_code;
        course.units = data.units;
        course.course_level = data.course_level;
        course.grade_option = data.grade_option;
        course.grade = data.grade;
        course.course_title = data.course_title;
        course.enrollment_status = data.enrollment_status;
        course.repeat_code = data.repeat_code;
        course.section_data = [];
        for( var section of data.section_data )
            course.section_data.push( UCSDSection.fromJSON( section ) );

        return course;
    }

    /**
     * The term code for this course
     * i.e FA19 SU20 SP13
     * @returns {string}
     */
    getTermCode() {
        return this.term_code;
    }

    /**
     * The subject code for this course
     * i.e. COGS CSE PHYS
     * @returns {string}
     */
    getSubjectCode() {
        return this.subject_code;
    }

    /**
     * The course code for this course
     * i.e. 101, 10B, 15L
     * @returns {string}
     */
    getCourseCode() {
        return this.course_code;
    }

    /**
     * The unit weight of the course
     * i.e. 2, 3, 4...
     * @returns {number}
     */
    getUnits() {
        return this.units;
    }

    /**
     * The course level of the course
     * i.e. UD (upper division) LD (lower division)
     * @returns {string}
     */
    getCourseLevel() {
        return this.course_level;
    }

    /**
     * The grade option for the course
     * i.e. L PNP
     * @returns {string}
     */
    getGradeOption() {
        return this.grade_option;
    }

    /**
     * The grade earned, empty string if no grade earned
     * @returns {string}
     */
    getGrade() {
        return this.grade;
    }

    /**
     * The course title
     * @returns {string}
     */
    getCourseTitle() {
        return this.course_title;
    }

    /**
     * The enrollment status of the course
     * i.e. EN, WL
     * @returns {string}
     */
    getEnrollmentStatus() {
        return this.enrollment_status;
    }

    /**
     * The repeat code of the course
     * i.e. Y, N
     * @returns {string}
     */
    getRepeatCode() {
        return this.repeat_code;
    }

    /**
     * The sections associated with this course
     * @returns {UCSDSection[]}
     */
    getSections() {
        return this.section_data;
    }

}

module.exports = UCSDCourse;