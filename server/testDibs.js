const Dibs = require('./utilities/dibs/dibs.js');

let dibs = new Dibs();

dibs.update( function() {

    let rooms = dibs.getRooms();
    let now = new Date();

    let printPromises = [];

    for( const room of rooms )
        printPromises.push(
            new Promise( (resolve, reject) => {
                dibs.getRoomAvailableHours( room, now.getFullYear(), now.getMonth() + 1, now.getDate(),
                        hours => {
                    for( const hour of hours )
                        console.log( hour.getRoom().getID() + " from " + hour.getStart() + " to " + hour.getEnd() );
                }, error => {
                    console.log( "Could not get hours for " + room.getID() )
                    });
            })
        );

    Promise.all( printPromises );

});