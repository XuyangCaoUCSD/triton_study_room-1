const axios = require('axios').default;
const DibsRoom = require('./dibsRoom.js');
const DibsBuilding = require('./dibsBuilding.js');
const DibsRoomHours = require('./dibsRoomHours');

const INDEX_JUMPS_PER_HOUR = 2;
const INDEX_JUMPS_PER_HALF_HOUR = 1;
const MINUTES_PER_HALF_HOUR = 30;
const HALF_HOURS_IN_DAY = 48;

/**
 * Takes a date and maps it to the half-hour of the day, indexed, in which the date rests
 *
 * For example, 00:00 is at hour 0, minute 0, so it belongs in half-hour 0 (the first half-hour)
 * So does 00:29, which belongs in the first half hour.
 *
 * @param date The Date object for the time in question
 */
function calculateHalfHourToIndex( date ) {
    let min = date.getMinutes();
    let hour = date.getHours();
    return ( hour * INDEX_JUMPS_PER_HOUR ) + Math.floor( min / MINUTES_PER_HALF_HOUR ) * INDEX_JUMPS_PER_HALF_HOUR;
}

/**
 * Takes a half-hour of the day, indexed, and maps its start time to a date
 *
 * For example, half-hour 0 starts at 00:00
 *
 * @param index The half hour of the day, indexed starting at 0
 */
function calculateIndexToHalfHour( index ) {

}

function calculateAvailableHours( openHours, reservedHours ) {

    /*
     * The first half hour of the 24-hour day is at  0.
     * That is, index  0 represents [00:00, 00:30]
     *
     *
     * The last  half hour of the 24-hour day is at 47
     * That is, index 47 represents [23:30, 00:00]
     *
     *
     * Also note that hour  0 or [00:00, 01:00] spans indices [ 0,  1],
     *                hour  1 or [01:00, 02:00] spans indices [ 2,  3],
     *                hour 11 or [12:00, 13:00] spans indices [22, 23],
     *                hour 23 or [23:00, 00:00] spans indices [46, 47]
     */
    let isOpenAtHalfHour = new Array( HALF_HOURS_IN_DAY );
    isOpenAtHalfHour.fill( false );

    let startIndex = 0;
    let endIndex = 0;

    //hourOpen is of type DibsRoomHour
    //here we find the hours at which the room is actually open
    for( const hourOpen of openHours ) {
        startIndex = calculateHalfHourToIndex( new Date( hourOpen.getStart() ) );
        endIndex = calculateHalfHourToIndex( new Date( hourOpen.getEnd() ) );
        isOpenAtHalfHour.fill( true, startIndex, endIndex ) ;
    }

    //hourReserved is of type DibsRoomHour
    //here we negate the hours at which the room is reserved
    for( const hourReserved of reservedHours ) {
        startIndex = calculateHalfHourToIndex( new Date( hourReserved.getStart() ) );
        endIndex = calculateHalfHourToIndex( new Date( hourReserved.getEnd() ) );
        isOpenAtHalfHour.fill( false, startIndex, endIndex ) ;
    }

    for( let i = 0; i < HALF_HOURS_IN_DAY; i++ ) {
        if( isOpenAtHalfHour[i] ) {
            lowerBound = new Date(  )
        }
    }
}

/**
 * Allows us to access the D!BS API
 * As a note, all date/times are UTC-0800, Pacific Standard Time
 */
class Dibs {

    static API_BUILDINGS = "/dibsapi/buildings";
    static API_ROOMS = "/dibsapi/rooms";
    static API_ROOM_HOURS = "/dibsapi/roomHours";
    static API_ROOM_RESERVATIONS = "/dibsapi/reservations";
    static API_POST_RESERVATION = "/admin/dibs/api/reservations/post";

    api;
    buildings;
    rooms;

    /**
     * Creates an instance of the API interface. Only one should really be maintained. It can be updated via
     * update(). Alternatively, a new object can be created to replace whatever old one was made.
     */
    constructor() {

        //The Axios instance that will grant us access to D!BS
        this.api = axios.create( {
            baseURL: "http://ucsd.evanced.info",
            timeout: 10000,
            headers: {}
        } );

    }

    /**
     * An array of DibsRoom that lists all rooms available in the system. Should really only be called once per update.
     * @returns {[]}
     */
    getRooms() {
        var rooms = [];
        this.rooms.forEach( ( value, key, map ) => rooms.push( this.rooms.get( key ) ) );
        return rooms;
    }

    /**
     * An array of DibsBuilding that lists all buildings available in the system. Should only be called once per update.
     * @returns {[]}
     */
    getBuildings() {
        var buildings = [];
        this.buildings.forEach( ( value, key, map ) => buildings.push( value) );
        return buildings;
    }

    /**
     * Parses a building from the JSON sent by the D!BS system
     * @param buildingJSON The JSON sent by the D!BS system
     */
    parseBuilding( buildingJSON ) {
        if( buildingJSON.BuildingID === 0 ) return;
        let nextBuilding = new DibsBuilding( buildingJSON.BuildingID,
                                             buildingJSON.Description,
                                             buildingJSON.Latitude,
                                             buildingJSON.Longitude,
                                             buildingJSON.Name,
                                             buildingJSON.Picture );

        this.buildings.set( nextBuilding.getID(), nextBuilding );
    }

    /**
     * Parses a room from the JSON sent by the D!BS system
     * @param roomJSON The JSON sent by the D!BS system
     */
    parseRoom( roomJSON ) {
        let nextRoom = new DibsRoom( roomJSON.BuildingID,
                                     roomJSON.Description,
                                     roomJSON.Name,
                                     roomJSON.Picture,
                                     roomJSON.RoomID );

        this.rooms.set( nextRoom.getID(), nextRoom );
        this.buildings.get( roomJSON.BuildingID ).addRoom( nextRoom );
    }

    /**
     * Updates the interface with a new data pull from the D!BS system
     * @param onUpdate A function taking no arguments that will be called after all data has been updated
     */
    update( onUpdate ) {
        this.buildings = new Map();
        this.rooms = new Map();

        //get all buildings
        this.api.get( Dibs.API_BUILDINGS )
                .then( function ( response ) {

                    for( var buildingJSON of response.data )
                        this.parseBuilding( buildingJSON );

                    //after which we can get all rooms
                    this.api.get( Dibs.API_ROOMS )
                            .then( function ( response ) {

                                for( var roomJSON of response.data )
                                    this.parseRoom( roomJSON );

                                onUpdate();

                            }.bind(this));

                }.bind (this ) )
                .catch( function ( error ) {
                    console.log( error );
                })
    }

    /**
     * The building with the given ID, if it is in the cache
     * @param id The integer ID of the building
     * @returns {*}
     */
    getBuildingByID( id ) {
        return this.buildings.get( id );
    }

    /**
     * The room with the given ID, if it is in the cache
     * @param id The integer ID of the room
     * @returns {*}
     */
    getRoomByID( id ) {
        return this.rooms.get( id );
    }

    /**
     * Handles a call from getRoomOpenHours or getRoomReservedHours after the information is found
     * @param response The response from an AXIOS get request
     * @param onGet The function to which hours are passed once data is found
     * @returns {[]}
     */
    handleRoomHoursRequest( response, onGet ) {

        let hours = [];
        for( const hourJSON of response.data ) {
            let nextHour = new DibsRoomHours( this.getRoomByID( hourJSON.RoomID ), hourJSON.StartTime, hourJSON.EndTime );
            hours.push( nextHour );
        }
        onGet( hours );

    }

    /**
     * The business hours of the room on the given date and time.
     * @param room The room for which hours are needed
     * @param year for the given year
     * @param month for the given month
     * @param day on the given day
     * @param onGet The function to call taking in a single DibsRoomHours argument after the data has been found
     * @param onError the function to call taking in a single promise error argument on the occasion an error occurs
     */
    getRoomOpenHours( room, year, month, day, onGet, onError ) {
        this.api.get( Dibs.API_ROOM_HOURS + `/${year}-${month}-${day}/${room.getID()}` )
                .then( function( response ) {
                    this.handleRoomHoursRequest( response, onGet );
                }.bind( this )  )
                .catch( onError );
    }

    /**
     * The reserved time blocks in a room on the D!BS system
     * @param room The room for which hours are needed
     * @param year for the given year
     * @param month for the given month
     * @param day on the given day
     * @param onGet The function to call taking in a single DibsRoomHours[] argument after the data has been found
     * @param onError the function to call taking in a single promise error argument on the occasion an error occurs
     */
    getRoomReservedHours( room, year, month, day, onGet, onError ) {
        this.api.get( Dibs.API_ROOM_RESERVATIONS + `/${year}-${month}-${day}/${room.getID()}` )
            .then( function( response ) {
                this.handleRoomHoursRequest( response, onGet );
            }.bind( this )  )
            .catch( onError );
    }

    /**
     * The available time blocks in a room on the D!BS system
     * @param room The room for which hours are needed
     * @param year for the given year
     * @param month for the given month
     * @param day on the given day
     * @param onGet The function to call taking in a single DibsRoomHours[] argument after the data has been found
     * @param onError the function to call taking in a single promise error argument on the occasion an error occurs
     */
    getRoomAvailableHours( room, year, month, day, onGet, onError ) {
        this.getRoomOpenHours( room, year, month, day, function( openHours ) {
            this.getRoomReservedHours( room, year, month, day, function( reservedHours ) {
                const availableHours = calculateAvailableHours( openHours, reservedHours );
                onGet( availableHours );
            }.bind( this ), onError )
        }.bind(this), onError );
    }

    /**
     * Attempts to make a reservation as specified in the given DibsReservationRequest
     * @param reservationRequest The DibsReservationRequest that describes the desired reservation
     * @param onSuccess The function to call when the reservation is made, taking a DibsRoomHours object and message string
     * @param onFailure The function to call when the reservation fails, taking a single message string
     * @param onError the function to call taking in a single promise error argument on the occasion an error occurs
     * @returns {*}
     */
    postReservation( reservationRequest, onSuccess, onFailure, onError ) {
        return this.api.post( Dibs.API_POST_RESERVATION, reservationRequest.toJSON() )
                       .then( function( response ) {
                           if( response.data.IsSuccess ){
                               let hoursReserved = new DibsRoomHours( reservationRequest.getRoom(),
                                                                      reservationRequest.getStart(),
                                                                      new Date( reservationRequest.getStart() ) + ( reservationRequest.duration * 60 * 60 * 1000 )  ).toString();
                               onSuccess( hoursReserved, response.data.Message )
                           }
                           else onFailure( response.data.Message );
                       })
                       .catch( onError )
    }
}

module.exports = Dibs;