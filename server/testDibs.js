const Dibs = require('./utitlities/dibs/dibs.js');

let dibs = new Dibs();

dibs.getRooms().forEach( function( room ) {
    dibs.getRoomOpenHours( room, 2019, 11, 25,
        function( hours ) {
            console.log( hours )
        },
        function ( error ) {
            console.log( error )
        });
} );