// const mongoose = require('mongoose');
// mongoose.connect('mongodb://127.0.0.1/testPerfData', {useNewUrlParser: true, useUnifiedTopology: true });
// const Machine = require('./models/Machine');

// function socketMain(io, socket) {
//     // console.log("A socket connected!", socket.id);
    
//     socket.on('clientAuth', (key) => {
//         if (key === '5jaldfa8923jnlk9fvqpnc902fs') {
//             // valid nodeClient
//             socket.join('clients');
//         } else if (key === 'uixa02mdcdvw') {
//             // valid ui client has joined
//             socket.join('ui');
//             console.log('A react client has joined!');
//             Machine.find({}, (err, docs) => {
//                 docs.forEach((aMachine) => {
//                     // On load, assume that all machines are offline
//                     aMachine.isActive = false;
//                     io.to('ui').emit('data', aMachine);
//                 });
//             });
//         } else {
//             // an invalid client has joined. Goodbye
//             socket.disconnect(true);
//         }
//     });

//     socket.on('disconnect', () => {
//         // macA variable made available to function few lines below in initPerfData event
//         Machine.findOne({macA: macA}, (err, machine) => {
//             if (machine != {}) {
//                 // send one last emit to React
//                 machine.isActive = false;
//                 io.to('ui').emit('data', machine);
//             }
//         })
//     })

//     // a machine has connected, check to see if it's new
//     // if it is, add it!
//     socket.on('initPerfData', async (data) => {
//         // update our socket function scoped variable
//         macA = data.macA;

//         // now go check mongo
//         const mongooseResponse = await checkAndAdd(data);
//         console.log(mongooseResponse);
//     });
    
//     socket.on('perfData', (data) => {
//         console.log("Tick...");
//         io.to('ui').emit('data', data);
//     });
// }

// function checkAndAdd(data) {
//     // because we are doing db stuff, JS won't wait for db
//     // so we need to make this a promise
//     return new Promise((resolve, reject) => {
//         Machine.findOne(
//             {macA: data.macA},
//             (err, foundMachine) => {
//                 if (err) {
//                     throw err;
//                     reject(err);
//                 } else if (foundMachine === null) {
//                     // if record not in db add it
//                     let newMachine = new Machine(data);
//                     newMachine.save(); // save to db
//                     resolve('added');
//                 } else {
//                     // it is in db, just resolve
//                     resolve('found');
//                 }
//             }
//         )
//     });
// }

// module.exports = socketMain;



// let namespaces = require('./data/namespaces');

// // Loop through each namespace and listen for a connection
// namespaces.forEach((namespace) => {
//     io.of(namespace.endpoint).on('connection', (nsSocket) => {
//         // Handshake only happens once upon first HTTP request, so socket.handshake still exists in any namespace
//         const username = nsSocket.handshake.query.username;
//         // console.log(`${nsSocket.id} has joined ${namespace.endpoint}`);
//         // a socket has connected to one of our namespaces. 
//         // send that ns group info (e.g. rooms belonging to namespace) back
//         nsSocket.emit('nsRoomLoad', namespace.rooms);

//         // numberofUsersCallback is the callback sent from client
//         nsSocket.on('joinRoom', (roomToJoin, numberOfUsersCallback) => {
//             console.log(nsSocket.rooms);

//             // Leave old room

//             // The user will be in the 2nd room in the object list 
//             // This is because the socket ALWAYS joins its own room (which is not the room we want to send to) on connection
//             // Get the keys which will be the room name
//             const roomToLeave = Object.keys(nsSocket.rooms)[1]; // Get 2nd key (i.e. at idx 1) which is room socket is joined
//             nsSocket.leave(roomToLeave);
//             updateUsersInRoom(namespace, roomToLeave);
            
//             // Server socket api to join room
//             nsSocket.join(roomToJoin);

//             // Find room object of room just joined to update chat history
//             const nsRoom = namespace.rooms.find((room) => {
//                 return roomToJoin === room.roomTitle;
//             });
//             nsSocket.emit('historyCatchup', nsRoom.history); 

//             updateUsersInRoom(namespace, roomToJoin);

//         });

//         nsSocket.on('newMessageToServer', (msg) => {
//             const fullMsg = {
//                 text: msg.text,
//                 time: Date.now(),
//                 username: username,
//                 avatar: "https://via.placeholder.com/30"
//             }
//             // console.log(fullMsg);
//             // Send message to all sockets in room this socket is in
//             // console.log(nsSocket.rooms);

//             // The user will be in the 2nd room in the object list 
//             // This is because the socket ALWAYS joins its own room (which is not the room we want to send to) on connection
//             // Get the keys which will be the room name
//             const roomTitle = Object.keys(nsSocket.rooms)[1]; // Get 2nd key (i.e. at idx 1) which is room socket has joined

//             // Find room object for this room
//             const nsRoom = namespace.rooms.find((room) => {
//                 return room.roomTitle === roomTitle;
//             });
//             // console.log("The room object that matches this namespace room is");
//             // console.log(nsRoom);

//             nsRoom.addMessage(fullMsg);
//             io.of(namespace.endpoint).to(roomTitle).emit('messageToClients', fullMsg);

//         });
//     });
// });

// function updateUsersInRoom(namespace, roomToJoin) {      
//     // Send back num of users in this room to all sockets connected to this room
//     io.of(namespace.endpoint).in(roomToJoin).clients((error, clients) => {
//         // console.log(`There are ${clients.length} users in this room`);
//         io.of(namespace.endpoint).in(roomToJoin).emit('updateMembers', clients.length);
//     });
// }