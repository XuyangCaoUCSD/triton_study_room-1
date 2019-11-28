const axios = require('axios').default;
const DibsRoom = require('./dibsRoom.js');
const DibsBuilding = require('./dibsBuilding.js');

class Dibs {

    static API_BUILDINGS = "/dibsapi/buildings";
    static API_ROOMS = "/dibsapi/rooms";
    static API_ROOM_HOURS = "/dibsapi/roomHours";
    static API_ROOM_RESERVATIONS = "/dibsapi/reservations";
    static API_POST_RESERVATION = "/admin/dibs/api/reservations/post";
    api;
    buildings;
    rooms;

    update() {
        this.buildings = new Map();
        this.rooms = new Map();

        //get all rooms
        this.api.get( Dibs.API_ROOMS )

            .then( function( response ) {

                response.data.forEach( function( roomJSON ) {

                    let nextRoom = new DibsRoom( this.buildings.get( roomJSON.BuildingID ),
                        roomJSON.Description,
                        roomJSON.Name,
                        roomJSON.Picture,
                        roomJSON.RoomID );

                    this.rooms.set( nextRoom.getID(), nextRoom );

                }.bind( this ) );

            }.bind( this ) )

            .catch( function( error ) {

                console.log( error );

            } );
    }

    constructor() {

        //The Axios instance that will grant us access to D!BS
        this.api = axios.create( {
            baseURL: "http://ucsd.evanced.info",
            timeout: 1000,
            headers: {}
        } );

        this.update();
    }

    getBuildingByID( id ) {
        return this.buildings.get( id );
    }

    getRoomOpenHours( room, year, month, day, onGet, onError ) {
        this.api.get( Dibs.API_ROOM_HOURS + `${year}-${month}-${day}/${room.getID()}` )
            .then( function( response ) {
                onGet( {
                    start: response.data.StartTime,
                    end: response.data.EndTime
                } );
            } )
            .onError( onError );
    }

    getRoomReservedHours( room, year, month, dat, onGet, onError ) {
        this.api.get( Dibs.API_ROOM_RESERVATIONS + `${year}-${month}-${day}/${room.getID()}` )
            .then( function( response ) {

                var reservations = [];
                response.data.forEach( function( reservationJSON ) {
                    reservations.push( {
                        start: reservationJSON.StartTime,
                        end: reservationJSON.EndTime
                    } )
                });
                onGet( reservations );
            } )
            .onError( onError );
    }

    postReservation( firstName, lastName, room, date, duration, phoneNumber, email ) {
        return this.api.post( Dibs.API_POST_RESERVATION, {
            firstName: firstName,
            lastName: lastName,
            roomid: roomid,
            startDate: date,
            reservationLength: duration,
            phoneNumber: phoneNumber,
            emailAddress: email,
            cardNumber: "",
            langCode: "en-US",
            staffAccess: false
        } );
    }
}

module.exports = Dibs;