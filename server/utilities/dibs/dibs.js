const axios = require('axios').default;
const DibsRoom = require('./dibsRoom.js');
const DibsBuilding = require('./dibsBuilding.js');
const DibsRoomHours = require('./dibsRoomHours');

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
        let nextRoom = new DibsRoom( this.buildings.get( roomJSON.BuildingID ),
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

        var hours = [];
        for( var hourJSON of response.data ) {
            var nextHour = new DibsRoomHours( this.getRoomByID( hourJSON.RoomID ), hourJSON.StartTime, hourJSON.EndTime );
            hours.push( nextHour );
        }
        onGet( hours );

    }

    /**
     * The open hours of the room on the given date and time.
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