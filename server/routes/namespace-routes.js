const  express       = require('express'),
       User          = require('../models/User'),
       middleware    = require('../middleware/index'),
       Namespace     = require('../models/Namespace');

const { ChatHistory } = require('../models/ChatHistory');
const redisClient = require('../redisClient');
const { setNamespaceUnreads, setRoomUnreads } = require('../socketMainTest');

const router = express.Router();


// Create new group
router.post('/', middleware.isLoggedIn, (req, res) => {
    let userId = req.session.passport.user;

    let privateChat = req.body.privateChat;
    let secondUserEmail = req.body.secondUserEmail;
    let peopleList = req.body.peopleList;

    console.log('privateChat is')
    console.log(privateChat);
    console.log('secondUserEmail is');
    console.log(secondUserEmail);
    console.log('peopleList is');
    console.log(peopleList);

    const io = req.app.get('socketio');

    findOrCreateNewGroup(res, io, userId, secondUserEmail, privateChat, peopleList);
    
});

router.get('/:namespace', middleware.isLoggedIn, (req, res) => {
    console.log('req.params is');
    console.log(req.params);

    // if (req.params.namespace !== 'cse110') {
    //     console.log('Error, Use cse110 for testing purposes!');
    // }

    let userId = req.session.passport.user;

    let data = {
        success: true,
        nsData: null,
        currNs: null,
        currRoom: null
    }
    let endpoint = "/" + req.params.namespace;
    // Find if namespace name exists in db
    Namespace.findOne({
        endpoint: endpoint
    }) //.populate({ path: 'rooms', populate: { path: 'chatHistory', model: 'ChatHistory' }})
    .exec((err, foundNamespace) => {
        if (err || !foundNamespace) {
            if (err) {
                console.log(err);
            }
            
            // console.log('Group does not yet exist, creating new');
            // let privateChat = req.body.privateChat;
            // let secondUserEmail = req.body.secondUserEmail;
            // let peopleList = req.body.peopleList;
            console.log('CANNOT FIND NAMESPACE');
            data.success = false;
            res.send(data);
            return;
        } else {
            // Serverside authorisation check (if user has permission for group) (in case somehow user has access to link)
            if (foundNamespace.people.indexOf(userId) === -1) {
                console.log('Attempted unauthorized access');
                res.statusMessage = "UNAUTHORISED CREDENTIALS!";
                res.status(403);
                res.send("ERROR, UNAUTHORIZED CREDENTIALS");
                return;
            }

            // Once user click in namespace, no longer mark as read
            setNamespaceUnreads(endpoint, userId, false);

            data.currNs = foundNamespace;
            let currRoom = foundNamespace.rooms[0]; // Use Default first room to join
            let chatHistoryId = currRoom.chatHistory; 

            setRoomUnreads(endpoint, currRoom.roomName, userId, false);

            ChatHistory.findById(
                chatHistoryId
            ).then((foundChatHistory) => {
                // console.log('foundChatHistory is:');
                // console.log(foundChatHistory);
                currRoom.chatHistory = foundChatHistory;  // Replace id in currRoom var with actual messages
                data.currRoom = currRoom;
                
                // Populate user's nsData
                User.findById(userId).populate('namespaces').exec((err, foundUser) => {
                    if (err || !foundUser) {
                    console.log(err);
                    console.log('User not found')
                    } else {
                        data.userEmail = foundUser.email;

                        let nsData = foundUser.namespaces.map((ns) => {
                            return {
                                img: ns.img,
                                endpoint: ns.endpoint,
                                groupName: ns.groupName
                            }
                        });

                        // console.log('nsData is');
                        // console.log(nsData);
                        
                        data.nsData = nsData;           


                        const roomNotifications = {};

                        // Sends final data in function call below
                        getUserRoomUnreads(endpoint, userId, 0, foundNamespace.rooms, res, roomNotifications, data);
                               
                    }
                });    

            }).catch((err) => {
                console.log(err);
            });

        }
    });
    
});

// Recursive call function over rooms to ensure callback chaining for redis calls for room unreads
function getUserRoomUnreads(endpoint, userId, i, rooms, res, roomNotifications, data) {
    // Check in cache if there is unread messages for this user in this room
    let room = rooms[i];
    redisClient.hget(`${endpoint} ${room.roomName} Unreads`, userId, function (error, result) {
        if (error) {
            console.log(error);
            // throw error;
            return;
        }

        console.log(`${endpoint} ${room.roomName} Unreads for ${userId} is `);
        console.log(result);

        // Care as result is of type string so not boolean
        // If there are unread messages, set to true, else false
        roomNotifications[room.roomName] = result == 'true' ? true : false;

        // Send response on last room
        if (i === rooms.length - 1) {
            data.roomNotifications = roomNotifications;
            // Todo Put in last callback / promise resolution needed for information retrieval
            // Send over namespace data 
            res.send(data); 
            console.log('Sending: ');
            console.log(data);
        } else {
            getUserRoomUnreads(endpoint, userId, i + 1, rooms, res, roomNotifications, data);
        }
    });
}

function findOrCreateNewGroup(res, io = null, firstUserId, secondUserEmail, privateChat = null, peopleList = null) {
    // Response data
    let data = {
        success: true
    }

    if (privateChat) {
        // Only create group if both users are valid
        User.findById(firstUserId)
        .then((foundUser1) => {
            if (!foundUser1) {
                console.log('ERROR User1 not found');
                data.success = false;
                res.send(data)
                return;
            }

            User.findOne({
                email: secondUserEmail
            }).then((foundUser2) => {
                if (!foundUser2) {
                    console.log('ERROR User' + secondUserEmail + 'not found');
                    data.success = false;
                    res.send(data);
                    return;
                }

                let firstUserEmail = foundUser1.email;

                let firstUserEmailLocal = firstUserEmail.split("@", 1)[0];
                let secondUserEmailLocal = secondUserEmail.toString().split("@", 1)[0]; 

                let firstPart, secondPart;
                // IF LOCAL PART SAME WON'T BE CONSISTENT/DETERMINISTIC BUT SHOULD NOT BE IF ALL UCSD EMAILS
                if (firstUserEmailLocal <= secondUserEmailLocal) {
                    firstPart = firstUserEmailLocal;
                    secondPart = secondUserEmailLocal;
                } else {
                    firstPart = secondUserEmailLocal;
                    secondPart = firstUserEmailLocal;
                }

                // ".." character is valid in url and invalid in emails => unique endpoint
                let groupEndpoint = "/" + firstPart + ".." + secondPart;
                console.log('Group endpoint (is/will be) ' + groupEndpoint);

                // Check if exist, if not create new
                Namespace.findOne({
                    endpoint: groupEndpoint
                }).then((foundNamespace) => {
                    // If already exist, just return it
                    if (foundNamespace) {
                        console.log('Existing direct message group');
                        data.group = foundNamespace;
                        res.send(data);
                        return;
                    }

                    // If not exist, create new

                    console.log('CREATING NEW DIRECT MESSAGING GROUP');
                    
                    ChatHistory.create({
                        messages: []
                    }).then((createdChatHistory) => {
                        console.log('created new chat history');
                        console.log(createdChatHistory);

                        Namespace.create({
                            nsId: -1,
                            groupName: 'Direct Message',
                            img: 'https://cdn4.iconfinder.com/data/icons/web-ui-color/128/Chat2-512.png',
                            endpoint: groupEndpoint,
                            privateChat: true,
                            rooms: [
                                {roomId: 0, roomName: 'General', chatHistory: createdChatHistory.id},
                            ],
                            people: [
                                firstUserId, foundUser2.id
                            ],
                            peopleDetails: [
                                { 
                                    email: firstUserEmail,
                                    givenName: foundUser1.givenName,
                                    name: foundUser1.name
                                },
                                { 
                                    email: secondUserEmail,
                                    givenName: foundUser2.givenName,
                                    name: foundUser2.name
                                }
                            ]
                        }).then((createdNamespace) => {
                            console.log('created new direct messaging group');
                            console.log(createdNamespace);
    
                            data.group = createdNamespace;
    
                            // Add new namespace to user namespaces array
                            User.findByIdAndUpdate(
                                firstUserId, 
                                {$push: 
                                    {
                                        "namespaces": createdNamespace.id
                                    }
                                },
                                {safe: true, upsert: true, new: true},
                            ).then((updatedUser) => {
    
                                // Send response
                                res.send(data);
                            }).catch((err) => {
                                console.log(err);
                            })         
    
                            User.findByIdAndUpdate(
                                foundUser2.id, 
                                {$push: 
                                    {
                                        "namespaces": createdNamespace.id
                                    }
                                },
                                {safe: true, upsert: true, new: true},
                            ).then((updatedUser) => {
                               
                            }).catch((err) => {
                                console.log(err);
                            })
    
                        }).catch((err) => {
                            console.log(err);
                        });
    
                    }).catch((err) => {
                        console.log(err);
                    });

                });
                

            }).catch((err) => {
                console.log(err);
            });

        }).catch((err) => {
            console.log(err);
        }); 
        
    } else {
        // Create group chat


    }

}

module.exports = router;