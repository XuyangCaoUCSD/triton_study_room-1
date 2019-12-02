const Dibs = require('./utilities/dibs/dibs.js');

let dibs = new Dibs();

dibs.update( function() {

    dibs.getRoomReservedHours( dibs.getRoomByID( 26 ), 2019, 12, 2, function( reservations ) {
        for( var result of reservations ) {
            console.log( result.getRoom().getName() + " from " + result.getStart() + " to " + result.getEnd() );
        }
    } );

});