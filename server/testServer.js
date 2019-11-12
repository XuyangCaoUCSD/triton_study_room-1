const  express     = require('express'),
       socketio          = require('socket.io');
app = express();


const server = app.listen(9999, () => {
	console.log("Starting test server");
});

const io = socketio(server);

// Listen to socket io client side connections to root namespace
io.on('connection', function(socket) {
    console.log("A socket connected!", socket.id);

    let cse110Name = '/namespace/cse110';
    io.of(cse110Name).on('connection', (nsSocket) => {
        console.log('nsSocket id is ' + nsSocket.id);

        nsSocket.on('userMessage', (msg) => {
            console.log('received message: ' + msg);
            // Hardcoded to cse 110 right now
            io.of(cse110Name).emit('userMessage', msg);
        })

        nsSocket.on('disconnect', () => {
            // Update number of users in namespace
            // io.of(cse110Name).emit('numUsers', '1');
            nsSocket.removeAllListeners('userMessage');
            nsSocket.removeAllListeners('disconnect');
        });
    });
});



