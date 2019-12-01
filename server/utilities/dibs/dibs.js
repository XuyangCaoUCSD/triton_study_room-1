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

    constructor() {

        //The Axios instance that will grant us access to D!BS
        this.api = axios.create( {
            baseURL: "http://ucsd.evanced.info",
            timeout: 1000,
            headers: {}
        } );

        this.update = this.update.bind( this );
        this.getBuildingByID = this.getBuildingByID.bind( this );
        this.getRoomOpenHours = this.getRoomOpenHours.bind( this );
        this.getRoomReservedHours = this.getRoomReservedHours.bind( this );
        this.postReservation = this.postReservation.bind( this );
        this.getRooms = this.getRooms.bind( this );
        this.getBuildings = this.getBuildings.bind( this );
    }

    getRooms() {
        return this.rooms;
    }

    getBuildings() {
        return this.buildings;
    }

    update( onUpdate ) {
        this.buildings = new Map();
        this.rooms = new Map();

        //get all buildings
        this.api.get( Dibs.API_BUILDINGS )

            .then( function( response ) {

                response.data.forEach( function( buildingJSON ) {

                    let nextBuilding = new DibsBuilding( buildingJSON.BuildingID,
                        buildingJSON.Description,
                        buildingJSON.Latitude,
                        buildingJSON.Longitude,
                        buildingJSON.Name,
                        buildingJSON.Picture );

                    this.buildings.set( nextBuilding.getID(), nextBuilding );

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
                                this.buildings.get( roomJSON.BuildingID ).addRoom( nextRoom );

                            }.bind( this ) );
                            onUpdate();
                        }.bind( this ))

                        .catch( function( error ) {
                            console.log( error );
                        } );

                }.bind( this ) );
            }.bind( this ))

            .catch( function( error ) {
                console.log( error );
            } );
    }

    getBuildingByID( id ) {
        return this.buildings.get( id );
    }

    getRoomOpenHours( room, year, month, day, onGet ) {
        this.api.get( Dibs.API_ROOM_HOURS + `/${year}-${month}-${day}/${room.getID()}` )
            .then( function( response ) {
                onGet( {
                    start: response.data.StartTime,
                    end: response.data.EndTime
                } );
            } )
            .onError( function( error ) {
                console.log( error );
            } );
    }

    getRoomReservedHours( room, year, month, day, onGet ) {
        this.api.get( Dibs.API_ROOM_RESERVATIONS + `/${year}-${month}-${day}/${room.getID()}` )
            .then( function( response ) {

                var reservations = [];
                for( var reservationJSON in response.data ) {
                    reservations.push( {
                        start: reservationJSON.StartTime,
                        end: reservationJSON.EndTime
                    } )
                }
                onGet( reservations );
            } )
            .onError( function( error ) {
                console.log( error );
            } );
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