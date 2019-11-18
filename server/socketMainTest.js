const mongoose = require('mongoose');
const User = require('./models/User');
const Namespace = require('./models/Namespace');
const { ChatHistory } = require('./models/ChatHistory');
const { Message } = require('./models/Message');
const keys = require('./config/keys');

mongoose.connect(keys.mongoDB.connectionURI, {useNewUrlParser: true, useUnifiedTopology: true });


const redis = require('redis');
// Create and connect redis client to local instance.
const redisClient = redis.createClient(6379)
 
// Log redis errors to the console
redisClient.on('error', (err) => {
    console.log("Error " + err)
});


function socketMainTest(io, workerId) {
    let existingNamespaces = [
        ['/namespace/cse110', 'cse110'],
        ['/namespace/cse100', 'cse100'],
        ['/namespace/cse101', 'cse101']
    ];

    // Loop through existing namespaces
    existingNamespaces.forEach((item) => {
        let namespaceRoute = item[0];
        let namespaceName = item[1];

        io.of(namespaceRoute).on('connection', (nsSocket) => {
            console.log('nsSocket id is ' + nsSocket.id);
            console.log('WorkerId is ' + workerId);
    
            let userId = nsSocket.request.user;
            console.log("User id is", userId);

        
            User.findById(userId).select("givenName name avatar email").exec(function (err, user) {
                if (err) {
                    console.log(err);
                    return;
                }
                
                let name = user.name; // full name
                let givenName = user.givenName;
                let avatar = user.avatar;
                let email = user.email;
                console.log('user.givenName is ' + givenName);
                console.log('user.avatar is ' + avatar);
                console.log('user.email is ' + email);

                let userInfo = {
                    userId,
                    givenName,
                    name,
                    avatar,
                    email
                }

                redisClient.hset(`${namespaceRoute} Active Users`, nsSocket.id, JSON.stringify(userInfo), redis.print);
                
                updateActiveUsersInNamespace(namespaceRoute);

                redisClient.hget(`${namespaceRoute} Active Users`, nsSocket.id, function(error, result) {
                    if (error) {
                        console.log(err);
                        throw error;
                    }
                    let data = JSON.parse(result);
                    console.log('GET RESULT:');
                    console.log(data);
                });

                nsSocket.on('userMessage', (msg) => {
                    console.log('received message: ' + msg);
        
                    // Find namespace and room to save in database
                    Namespace.findOne(
                        { groupName: namespaceName }, 
                        'rooms people' // Only retrieve necessary information
    
                    ).then((foundNamespace) => {
                        // console.log('Namespace is');
                        // console.log(foundNamespace);
    
                        //construct the message document
                        const createdMessage = new Message({
                            content: msg,
                            creatorName: givenName,
                            creatorAvatar: avatar,
                            creator: userId
                        });

                        const currRoomName = Object.keys(nsSocket.rooms)[1]; // Get 2nd key (i.e. at idx 1) which is room socket has joined
    
                        let room = foundNamespace.rooms.find((room) => {
                            return room.roomName === currRoomName;  // TODO "general" hardcoded
                        })
    
                        // console.log('Room to update is:');
                        // console.log(room);
    
                        ChatHistory.findByIdAndUpdate(
                            room.chatHistory, 
                            {$push: 
                                {
                                    "messages": createdMessage
                                }
                            },
                            {safe: true, upsert: true, new : true},
                        ).then((updatedChatHistory) => {
                            // console.log(updatedChatHistory);
                            let lastMessage = updatedChatHistory.messages[updatedChatHistory.messages.length - 1];
    
                            let response = {
                                content: msg,
                                creatorName: givenName,
                                creatorAvatar: lastMessage.creatorAvatar,
                                time: lastMessage.time
                            }
    
                            console.log('message response is :');
                            console.log(response);
                            
                            io.of(namespaceRoute).to(currRoomName).emit('userMessage', response);
    
                        }).catch((err) => {
                            console.log(err);
                        });
                        
                    }).catch((err) => {
                        console.log(err);
                    });
                    
                    
                });
    
            });
            
            // ------------ Below joins General room by default upon connection --------------

            // The user will be in the 2nd room in the object list 
            // This is because the socket ALWAYS joins its own room (which is not the room we want to send to) on connection
            // Get the keys which will be the room name
            const roomToLeave = Object.keys(nsSocket.rooms)[1]; // Get 2nd key (i.e. at idx 1) which is room socket is joined
            nsSocket.leave(roomToLeave);
            updateUsersInRoom(namespaceRoute, roomToLeave);
            console.log('Outer Leaving room: ' + roomToLeave);
            
            // Default room name to join (eventually can be top room in namespace)
            let defaultRoom = 'General';
            nsSocket.join(defaultRoom);
            updateUsersInRoom(namespaceRoute, defaultRoom);
            console.log('Outer Joining room: ' + defaultRoom);

            // ------------------ End of joining General room by default ----------------
            

            // Handles joining different room events
            nsSocket.on('joinRoom', (roomToJoin) => {
                // console.log(nsSocket.rooms);
                
                // Find namespace to find room to send response
                Namespace.findOne(
                    { groupName: namespaceName }, 
                    'groupName rooms people' // Only retrieve necessary information

                ).then((foundNamespace) => {

                    // Find room object of room just joined to update chat history
                    let room = foundNamespace.rooms.find((room) => {
                        return room.roomName === roomToJoin; 
                    });
                    // console.log('Room to update is:');
                    // console.log(room);
                    
                    // Find chat history object containing messages using id
                    ChatHistory.findById(
                        room.chatHistory,
                    ).then((foundChatHistory) => {       
                        // Leave old room
                        // The user will be in the 2nd room in the object list 
                        // This is because the socket ALWAYS joins its own room (which is not the room we want to send to) on connection
                        // Get the keys which will be the room name
                        const roomToLeave = Object.keys(nsSocket.rooms)[1]; // Get 2nd key (i.e. at idx 1) which is room socket is joined
                        nsSocket.leave(roomToLeave);
                        updateUsersInRoom(namespaceRoute, roomToLeave);
                        
                        console.log('Joining room ' + roomToJoin);
                         
                        // Server socket api to join room
                        nsSocket.join(roomToJoin);

                        room.chatHistory = foundChatHistory;

                        // console.log(room);

                        nsSocket.emit('changeRoom', room);
            
                        updateUsersInRoom(namespaceRoute, roomToJoin);

                    }).catch((err) => {
                        console.log(err);
                    });
                    
                }).catch((err) => {
                    console.log(err);
                });
                
    
            });

            nsSocket.on('disconnect', () => {
                console.log('Socket Disconnected: ' + nsSocket.id);
                // TODO Update number of users in namespace
                // io.of(namespaceRoute).emit('numUsers', '1');
                
                // Remove from cache
                redisClient.hdel(`${namespaceRoute} Active Users`, nsSocket.id, function(error, success) {
                    if (error) {
                        console.log(err);
                        throw error;
                    }
                    
                    if (success) {
                        console.log('(REDIS) Successefully deleted ' + nsSocket.id + ' entry in ' + `"${namespaceRoute} Active Users"`);
                    }

                    updateActiveUsersInNamespace(namespaceRoute);
                });
            });
        });
    });


    function updateActiveUsersInNamespace(namespaceRoute) {
        redisClient.hgetall(`${namespaceRoute} Active Users`, function (error, result) {
            if (error) {
                console.log(error);
                throw error;
            }

            let activeUsers = {};
            
            // If empty, send empty
            if (!result) {
                console.log('Empty result');
                // TODO send to all rooms
                io.of(namespaceRoute).emit('updateActiveUsers', activeUsers);
                return;
            }

            const userInfos = Object.values(result);
            for (let userInfo of userInfos) {
                let parsedUserInfo = JSON.parse(userInfo); // Parse each userInfo object
                activeUsers[parsedUserInfo.email] = parsedUserInfo;
            } 

            console.log('ActiveUsers response:');
            console.log(activeUsers);

            // TODO send to all rooms
            io.of(namespaceRoute).emit('updateActiveUsers', activeUsers);
        });

    }

    function updateUsersInRoom(namespaceRoute, roomName) {
        // Send back num of users in this room to all sockets connected to this room
        io.of(namespaceRoute).in(roomName).clients((error, clients) => {
            if (error) {
                console.log(error);
                return;
            }
            console.log('clients are');
            console.log(clients);
            // console.log(`There are ${clients.length} users in this room`);
            io.of(namespaceRoute).in(roomName).emit('updateMembers', clients.length);
        });
    }

}

module.exports = socketMainTest;