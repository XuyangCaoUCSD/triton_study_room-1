const mongoose = require('mongoose');
const User = require('./models/User');
const Namespace = require('./models/Namespace');
const { ChatHistory } = require('./models/ChatHistory');
const { Message } = require('./models/Message');
const keys = require('./config/keys');
mongoose.connect(keys.mongoDB.connectionURI, {useNewUrlParser: true, useUnifiedTopology: true });

function socketMain(io, socket) {
    console.log("A socket connected!", socket.id);

    let cse110Name = '/namespace/cse110';
    // Hardcoded 1 namespace for now
    io.of(cse110Name).once('connection', (nsSocket) => {
        console.log('nsSocket id is ' + nsSocket.id);

        let userId = socket.request.user;
        console.log("User id is", userId);
    
        User.findById(userId).select("givenName avatar").exec(function (err, user) {
            if (err) {
                console.log(err);
                return;
            }
            
            let givenName = user.givenName;
            let avatar = user.avatar;
            console.log('user.givenName is ' + givenName);

            nsSocket.on('userMessage', (msg) => {
                console.log('received message: ' + msg);
    
                // Find namespace and room to save in database
                // Todo cse110 hardcoded
                Namespace.findOne(
                    { groupName: "cse110" }, 
                    'groupName rooms people'

                ).then((foundNamespace) => {
                    console.log('Namespace is');
                    console.log(foundNamespace);

                    //construct the message document
                    const createdMessage = new Message({
                        content: msg,
                        creatorName: givenName,
                        creatorAvatar: avatar,
                        creator: userId
                    });

                    let room = foundNamespace.rooms.find((room) => {
                        return room.roomName === "General";  // TODO "general" hardcoded
                    })

                    ChatHistory.findByIdAndUpdate(
                        room._id, 
                        {$push: 
                            {
                                "messages": createdMessage
                            }
                        },
                        {safe: true, upsert: true, new : true},
                    ).then((updatedChatHistory) => {
                        console.log(ChatHistory);
                        let lastMessage = updatedChatHistory.messages[updatedChatHistory.messages.length - 1];

                        let response = {
                            content: msg,
                            sender: givenName,
                            avatar: lastMessage.creatorAvatar,
                            time: lastMessage.time
                        }

                        console.log('message response is :');
                        console.log(response);
        
                        // Hardcoded to cse 110 route right now
                        io.of(cse110Name).to(roomName).emit('userMessage', response);  // Hardcoded roomName for now

                    }).catch((err) => {
                        console.log(err);
                    });
                    
                }).catch((err) => {
                    console.log(err);
                });
                
                
            });

        });

        // The user will be in the 2nd room in the object list 
        // This is because the socket ALWAYS joins its own room (which is not the room we want to send to) on connection
        // Get the keys which will be the room name
        const roomToLeave = Object.keys(nsSocket.rooms)[1]; // Get 2nd key (i.e. at idx 1) which is room socket is joined
        nsSocket.leave(roomToLeave);
        console.log('Leaving room: ' + roomToLeave);

        let roomName = 'General';
        nsSocket.join(roomName); // Hardcoded for now

        console.log('Joining room: ' + roomName);
    
        nsSocket.on('disconnect', () => {
            console.log('Socket Disconnected: ' + nsSocket.id);
            // Update number of users in namespace
            // io.of(cse110Name).emit('numUsers', '1');

        });
    });
}

module.exports = socketMain;



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
