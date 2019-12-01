const Dibs = require('./utilities/dibs/dibs.js');

let dibs = new Dibs();

dibs.update( function() {
    dibs.getRooms().forEach( function( room ) {
        dibs.getRoomReservedHours( room, 2019, 11, 27,

            function( reservations ){
                console.log( "---RESERVATIONS FOR ROOM" + room.getID() + "---\n" + reservations );
            });
    });
});