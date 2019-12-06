const axios = require('axios').default;
const UCSDCourse = require('./ucsdCourse.js');

/**
 * Allows us to access the D!BS API
 * As a note, all date/times are UTC-0800, Pacific Standard Time
 */
class UCSDAPI {

    static REFRESH_API_KEY_URL = "https://api.ucsd.edu:8243/token?grant_type=client_credentials";
    static ACADEMIC_HISTORY_API_URL = "https://api.ucsd.edu:8243/academic_history/v1/students";
    static access_token;
    static accessTokenPromise;

    /**
     * Generates a new API key to use the APIs
     */
    static generateKey() {
        UCSDAPI.accessTokenPromise = axios( {
            url: UCSDAPI.REFRESH_API_KEY_URL,
            method: 'post',
            headers: {
                "Authorization" : "Basic Wm9PYWdqekhEeXlFNlJITGZ2V25wZjN4NlowYTpvMkNUTURjOEpod0JmN0FqWEpLRHdIVmRIYWth"
            }
        } )
            .then( res => UCSDAPI.access_token = res.data.access_token )
            .catch( error => { console.log( error ) } )
    }

    /**
     * Retrieves a student's wait-listed and enrolled classes
     * @param studentPID The PID of the student
     * @param term_code The term code (i.e. WI20, FA15)
     * @param academic_level The academic level (i.e. UN, GR )
     * @param onGet Called when the data is retrieved. Takes a single UCSDCourse[]
     * @param onError Called on the occasion of an error
     */
    static getAcademicHistory( studentPID, term_code, academic_level, onGet, onError ) {
        UCSDAPI.accessTokenPromise.then( res => axios( {
            url: UCSDAPI.ACADEMIC_HISTORY_API_URL + "/" + studentPID + "/class_list?term_code=" + term_code + "&academic_level=" + academic_level,
            method: 'get',
            headers: {
                "Accept" : "application/json",
                "Authorization" : "Bearer " + UCSDAPI.access_token
            }
        } )
            .then( res => {
                let courses = [];
                for( var courseJSON of res.data.data )
                    courses.push( UCSDCourse.fromJSON( courseJSON ) );
                onGet( courses );
            } )
            .catch( onError? onError : (error) => console.log( error ) ) )
    }
}

module.exports = UCSDAPI;