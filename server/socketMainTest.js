const mongoose = require('mongoose');
const User = require('./models/User');
const Namespace = require('./models/Namespace');
const { ChatHistory } = require('./models/ChatHistory');
const { Message } = require('./models/Message');
const keys = require('./config/keys');
const redis = require('redis');
const redisClient = require('./redisClient');

mongoose.connect(keys.mongoDB.connectionURI, {useNewUrlParser: true, useUnifiedTopology: true });

function socketMainTest(io, workerId) {
    let existingNamespaces = [
        ['/namespace/cse110', '/cse110', 'CSE 110'],
        ['/namespace/cse100', '/cse100', 'CSE 100'],
        ['/namespace/cse101', '/cse101', 'CSE 101']
    ];

    // Loop through existing namespaces
    existingNamespaces.forEach((item) => {
        let namespaceRoute = item[0];
        let namespaceEndpoint = item[1] 
        let namespaceName = item[2];

        io.of(namespaceRoute).on('connection', (nsSocket) => {
            console.log('nsSocket id is ' + nsSocket.id);
            console.log('WorkerId is ' + workerId);
    
            let userId = nsSocket.request.user;
            console.log("User id is", userId);

            // ------------ Below joins General room by default upon connection --------------

            // The user will be in the 2nd room in the object list 
            // This is because the socket ALWAYS joins its own room (which is not the room we want to send to) on connection
            // Get the keys which will be the room name
            const roomToLeave = Object.keys(nsSocket.rooms)[1]; // Get 2nd key (i.e. at idx 1) which is room socket is joined
            nsSocket.leave(roomToLeave);
            if (roomToLeave != null) { 
                setRoomUnreads(namespaceEndpoint, roomToLeave, userId, false);
            }
            // updateUsersInRoom(namespaceRoute, roomToLeave);
            console.log('Outer Leaving room: ' + roomToLeave);
            
            // Default room name to join (eventually can be top room in namespace)
            let defaultRoom = 'General';
            nsSocket.join(defaultRoom);
            setRoomUnreads(namespaceEndpoint, roomToLeave, userId, false);
            // updateUsersInRoom(namespaceRoute, defaultRoom);
            console.log('Outer Joining room: ' + defaultRoom);

            // ------------------ End of joining General room by default ----------------


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

                // Cache info
                redisClient.hset(`${namespaceEndpoint} Active Users`, userId, JSON.stringify(userInfo), function(err, result) {
                    if (err) {
                        console.log(err);
                        return;
                    } 
                    
                    if (result === 1) {
                        console.log('Entered new field');
                    } else {
                        console.log('Updated field');
                    }

                    updateActiveUsersInNamespace(namespaceRoute, namespaceEndpoint);
                });

                // Find namespace and room to save in database
                console.log('Endpoint is ' + namespaceEndpoint);
                Namespace.findOne(
                    { endpoint: namespaceEndpoint }, 
                    'rooms people' // Only retrieve necessary information

                ).then((foundNamespace) => {
                    // console.log('Namespace is');
                    // console.log(foundNamespace);

                    nsSocket.on('userMessage', (msg) => {
                        console.log('received message: ' + msg);
                        
                        const currRoomName = Object.keys(nsSocket.rooms)[1]; // Get 2nd key (i.e. at idx 1) which is room socket has joined
                        
                        // Find the correct room using name
                        let room = foundNamespace.rooms.find((room) => {
                            return room.roomName === currRoomName;  // TODO "general" hardcoded
                        })

                        //construct the message document
                        const createdMessage = new Message({
                            content: msg,
                            creatorName: givenName,
                            creatorAvatar: avatar,
                            creator: userId
                        });
    
                        // console.log('Room to update is:');
                        // console.log(room);
    
                        ChatHistory.findByIdAndUpdate(
                            room.chatHistory, 
                            {$push: 
                                {
                                    "messages": createdMessage
                                }
                            },
                            {safe: true, upsert: true, new: true},
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
                            
                            // Send message to users in room
                            io.of(namespaceRoute).to(currRoomName).emit('userMessage', response);

                            // Emit notification event to all users connected to namespace for real time change
                            io.of(namespaceRoute).emit('roomNotification', currRoomName);

                            // Below is to handle cases for non-online or online but not in namespace
                            redisClient.hkeys(`${namespaceEndpoint} Active Users`, function (error, result) {
                                if (error) {
                                    console.log(error);
                                    // throw error;
                                    return;
                                }
                            
                                // Shouldn't be emtpy, but return if it is for some reason
                                if (!result) {
                                    console.log('Unexpected empty result!');
                                    return;
                                }
                    
                                let onlineInNamespaceUserIds = {};
                                // Convert to hash map for faster lookup
                                result.forEach((onlineInNSUserId) => {
                                    onlineInNamespaceUserIds[onlineInNSUserId] = "onlineInNS";  // use truthy value
                                });

                                // Mark unreads for all users and also sending realtime information to online but not in namespace users
                                foundNamespace.people.forEach((memberUserId) => {
                                    // Mark unreads for all users (even in current room, let front-end handle
                                    // not displaying, and always clear unreads of room at user disconnect or leave room)
                                    // Save in cache (for simplicity + efficiency not storing 
                                    // notifs in DB => persistence tradeoff)
                                    setRoomUnreads(namespaceEndpoint, currRoomName, memberUserId, true);

                                    // If user not online in namespace
                                    if (!onlineInNamespaceUserIds[memberUserId]) {
                                        console.log('User ' + memberUserId + ' is not online in namespace');
                                        // Send real time notifications to users online BUT NOT online in namespace
                                        // front-end TODO new socket connection to general namespace
                                        redisClient.hget(`All Outside Active Sockets`, memberUserId.toString(), function (error, result) {
                                            if (error) {
                                                console.log(error);
                                                // throw error;
                                                return;
                                            }

                                            // Only send real time notifications if user is online but not in namespace
                                            if (!result) {
                                                console.log('User ' + memberUserId.toString() + ' not online at all');
                                                return;
                                            }

                                            // Send real time notification (TODO frontend)
                                            let socketId = result;
                                            console.log('Emitting messageNotification to ' + socketId);
                                            io.to(`${socketId}`).emit('messageNotification', namespaceEndpoint);
                                        });

                                        setNamespaceUnreads(namespaceEndpoint, memberUserId, true);
                                    }
                                    
                                });
                            });

    
                        }).catch((err) => {
                            console.log(err);
                        }); 
                    
                    });

                }).catch((err) => {
                    console.log(err);
                });
    
            });    

            // Handles joining different room events
            nsSocket.on('joinRoom', (roomToJoin) => {
                // Find namespace to find room to send response
                Namespace.findOne(
                    { endpoint: namespaceEndpoint }, 
                    'rooms people' // Only retrieve necessary information

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
                        setRoomUnreads(namespaceEndpoint, roomToLeave, userId, false);
                        
                        console.log('Joining room ' + roomToJoin);
                         
                        // Server socket api to join room
                        nsSocket.join(roomToJoin);


                        room.chatHistory = foundChatHistory;

                        // console.log(room);

                        nsSocket.emit('changeRoom', room);
            
                        // Mark any unread notifications as read in cache
                        setRoomUnreads(namespaceEndpoint, roomToJoin, userId, false);

                    }).catch((err) => {
                        console.log(err);
                    });
                    
                }).catch((err) => {
                    console.log(err);
                });
                
    
            });

            // Do stuff that needs access to socket rooms during disconnecting as won't have access in disconnected
            nsSocket.on('disconnecting', () => {   
                console.log('Socket DisconnectING: ' + nsSocket.id);    
                let roomToLeave = Object.keys(nsSocket.rooms)[1]; // Get 2nd key (i.e. at idx 1) which is room socket is joined
                setRoomUnreads(namespaceEndpoint, roomToLeave, userId, false);
            });

            nsSocket.on('disconnect', () => {
                console.log('Socket Disconnected: ' + nsSocket.id);

                // Remove from cache
                redisClient.hdel(`${namespaceEndpoint} Active Users`, userId, function(error, success) {
                    if (error) {
                        console.log(err);
                        // throw error;
                        return;
                    }
                    
                    if (success) {
                        console.log('(REDIS CB) Successfully deleted ' + userId + ' entry in ' + `"${namespaceEndpoint} Active Users"`);
                    }

                    updateActiveUsersInNamespace(namespaceRoute, namespaceEndpoint);
                });
         
            });
        });
    });


    function updateActiveUsersInNamespace(namespaceRoute, namespaceEndpoint) {
        redisClient.hgetall(`${namespaceEndpoint} Active Users`, function (error, result) {
            if (error) {
                console.log(error);
                // throw error;
                return;
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
                delete parsedUserInfo.userId; // Don't reveal userID to users
                delete parsedUserInfo.chatHistoryId; // Don't reveal chatHistoryId to users
                activeUsers[parsedUserInfo.email] = parsedUserInfo;
            } 

            console.log('ActiveUsers response:');
            console.log(activeUsers);

            // Send to all rooms
            io.of(namespaceRoute).emit('updateActiveUsers', activeUsers);
        });

    }

    // Not much point in keep track of number in each room (instead of namespace)
    // function updateUsersInRoom(namespaceRoute, roomName) {
    //     // Send back num of users in this room to all sockets connected to this room
    //     io.of(namespaceRoute).in(roomName).clients((error, clients) => {
    //         if (error) {
    //             console.log(error);
    //             return;
    //         }
    //         console.log('clients are');
    //         console.log(clients);
    //         // console.log(`There are ${clients.length} users in this room`);
    //         io.of(namespaceRoute).in(roomName).emit('updateMembers', clients.length);
    //     });
    // }

    
}

// Set unread to true or false in cache for user for some namespace room
function setRoomUnreads(namespaceEndpoint, roomName, userId, unread) {
    // Track notifications in cache (for simplicity + efficienc not storing notifS in DB => persistence tradeoff)
    redisClient.hset(`${namespaceEndpoint} ${roomName} Unreads`, userId.toString(), unread, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }

        if (result === 1) {
            console.log('Entered new notifications field for room ' + `${namespaceEndpoint} ${roomName} Unreads`);
        } else {
            console.log('Updated notifications field of user ' + userId.toString() + ' in ' 
                        + `${namespaceEndpoint} ${roomName} Unreads` + ' to ' + unread);
        }
    });
}

// Set unread to true or false in cache for user for some namespace
function setNamespaceUnreads(namespaceEndpoint, userId, unread) {
    redisClient.hset(`${namespaceEndpoint} Unreads`, userId.toString(), unread, function (err, result) {
        if (err) {
            console.log(err);
            return;
        }

        if (result === 1) {
            console.log('Setting notifications field for namespace ' + namespaceEndpoint + ' for ' + userId + ' to ' + unread);
        } else {
            console.log('Updated notifications field of user ' + userId.toString() + ' in ' 
                        + `${namespaceEndpoint} Unreads` + ' to ' + unread);
        }
    });
}

module.exports = {
    socketMainTest,
    setNamespaceUnreads,
    setRoomUnreads
}