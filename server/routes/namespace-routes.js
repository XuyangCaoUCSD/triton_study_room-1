const  express       = require('express'),
       User          = require('../models/User'),
       middleware    = require('../middleware/index'),
       Namespace     = require('../models/Namespace');

const { ChatHistory } = require('../models/ChatHistory');
const { File } = require('../models/File');
const redisClient = require('../redisClient');
const { setNamespaceUnreads, setRoomUnreads } = require('../socketMain');

const router = express.Router();


// Create new group
router.post('/', middleware.isLoggedIn, (req, res) => {
    let userId = req.session.passport.user;

    let privateChat = req.body.privateChat;
    let secondUserEmail = req.body.secondUserEmail;
    let peopleEmaiList = req.body.peopleEmaiList;
    let groupName = req.body.groupName;

    console.log('privateChat is')
    console.log(privateChat);
    console.log('secondUserEmail is');
    console.log(secondUserEmail);
    console.log('peopleEmaiList is');
    console.log(peopleEmaiList);  // List of all people in group
    console.log('groupName is');
    console.log(groupName);

    // const io = req.app.get('socketio');

    findOrCreateNewGroup(res, userId, secondUserEmail, privateChat, peopleEmaiList, groupName);
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
            // let peopleEmaiList = req.body.peopleEmaiList;
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
                            let peopleDetails = ns.peopleDetails;
                            return {
                                img: ns.img,
                                privateChat: ns.privateChat,
                                endpoint: ns.endpoint,
                                groupName: ns.groupName,
                                peopleDetails
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

// Adds user to namespace
router.put('/:namespace/add-user', middleware.isLoggedIn, (req, res) => {
    let userId = req.session.passport.user;
    let endpoint = "/" + req.params.namespace;

    let data = {
        success: true
    }

    User.findById(
        userId
    ).then((foundUser) => {

        Namespace.findOne({
            endpoint: endpoint
        }).then((foundNamespace) => {
            if (foundNamespace.people.indexOf(userId) !== -1) {
                console.log('User already in namespace');
                data.success = false;
                data.errorMessage = "User already in group";
                res.send(data);
                return;
            }

            // TODO
            if (foundNamespace.privateChat || foundNamespace.privateGroup) {

            }

            let userDetails = {
                email: foundUser.email,
                name: foundUser.name,
                givenName: foundUser.givenName,
                avatar: foundUser.avatar
            }

            Namespace.findByIdAndUpdate(
                foundNamespace.id,
                {$push: {'people': userId, 'peopleDetails': userDetails}},
                {safe: true, new: true}
            ).then((updatedNamespace) => {
                console.log('Updated namespace with user and details');
            
                res.send(data);
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

// Removes user permanently from namespace
router.delete('/:namespace/delete-user', middleware.isLoggedIn, (req, res) => {
    let userId = req.session.passport.user;
    let endpoint = "/" + req.params.namespace;

    let data = {
        success: true
    }

    Namespace.findOne({
        endpoint: endpoint
    }).then((foundNamespace) => {
        let userIndex = foundNamespace.people.indexOf(userId);
        if (userIndex === -1) {
            console.log('User was already not in namespace');
            data.success = false;
            data.errorMessage = "User was not in this namespace";
            res.send(data);
            return;
        }

        if (userIndex >= 0) {
            foundNamespace.people.splice(userIndex, 1);
        }

        // Find index of correct user object in details array
        for (var i = 0; i < foundNamespace.peopleDetails.length; i++) {
            if (foundNamespace.peopleDetails[i].email === foundUser.email) {
                break;
            }
        }

        if (i === foundNamespace.peopleDetails.length) {
            console.log('ERROR, COULD NOT FIND USER IN USERDETAILS ARRAY');
            data.success = false;
            data.errorMessage = 'ERROR, COULD NOT FIND USER IN USERDETAILS ARRAY';
            res.send(data);
            return;
        }

        foundNamespace.peopleDetails.splice(i, 1);
        
        foundNamespace.save().then((savedNamespace) => {
            console.log('Removed user details from namespace');
            res.send(data);
        }).catch((err) => {
            console.log(err);
        });


    }).catch((err) => {
        console.log(err);
    });

});

// TODO Get all files belonging to namespace
router.get('/:namespace/files', middleware.isLoggedIn, (req, res) => {
    
    console.log('Reached files get route');

    let userId = req.session.passport.user;
    let endpoint = "/" + req.params.namespace;

    let data = {
        success: true
    }

    Namespace.findOne({
        endpoint: endpoint
    }).select('people files')
    .then((foundNamespace) => {

        // Serverside authorisation check (if user has permission for group) (in case somehow user has access to link)
        if (foundNamespace.people.indexOf(userId) === -1) {
            console.log('Attempted unauthorized access');
            res.statusMessage = "UNAUTHORISED CREDENTIALS!";
            res.status(403);
            res.send("ERROR, UNAUTHORIZED CREDENTIALS");
            return;
        }

        console.log('Getting files from ' + endpoint);
        File.findById(foundNamespace.files).then((foundFileObj) => {
            // No need to expose file id
            data.files = foundFileObj.files.map((file) => {
                return {
                    originalName: file.originalName,
                    url: file.url
                }
            });
            res.send(data);
        }).catch((err) => {
            console.log(err);
        })
        
    })
    
})

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
            // console.log('Sending: ');
            // console.log(data);
        } else {
            getUserRoomUnreads(endpoint, userId, i + 1, rooms, res, roomNotifications, data);
        }
    });
}


// If private chat, either find or create new direct message.
// If private group, always attempt to create new. peopleEmailList should NOT contain the creator's when first passed in
function findOrCreateNewGroup(res, firstUserId, secondUserEmail, privateChat = null, peopleEmaiList = null, groupNameParam = null) {    
    // Response data
    let data = {
        success: true
    }

    if (privateChat) {
        // Direct message case: will check if room exists, if yes return that, else, create new group

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

                    console.log('\n\nCREATING NEW DIRECT MESSAGING GROUP\n\n');
                    
                    ChatHistory.create({
                        messages: []
                    }).then((createdChatHistory) => {
                        console.log('created new chat history');
                        console.log(createdChatHistory);
                        let groupName = 'Direct Message';
                        Namespace.create({
                            nsId: -1,
                            groupName: groupName,
                            img: 'https://cmkt-image-prd.freetls.fastly.net/0.1.0/ps/1154791/910/607/m1/fpnw/wm0/private-message-.png?1459936606&s=f28adc88796a73407283ce6ffe889335',
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
                                    avatar: foundUser1.avatar,
                                    name: foundUser1.name
                                },
                                { 
                                    email: secondUserEmail,
                                    givenName: foundUser2.givenName,
                                    avatar: foundUser2.avatar,
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
                                {
                                    $push: { "namespaces": createdNamespace.id }
                                },
                                {safe: true, upsert: true, new: true},
                            ).then((updatedUser) => {
                                
                                // Send Message to master to dynamically add listeners to all threads for new (dynamic) namespace
                                console.log('Sending newNamespace message to master');
                                let messageToMaster = {
                                    newNamespaceRoute: `/namespace${groupEndpoint}`,
                                    newNamespaceEndpoint: groupEndpoint,
                                    newNamespaceName: groupName
                                }
                                process.send(messageToMaster);

                                // Send response
                                res.send(data);
                            }).catch((err) => {
                                console.log(err);
                            })         
    
                            User.findByIdAndUpdate(
                                foundUser2.id, 
                                {
                                    $push: { "namespaces": createdNamespace.id }
                                },
                                {safe: true, new: true},
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
        // Create group chat case (will always try to create new group)

        if (!peopleEmaiList) {
            data.success = false;
            data.errorMessage = "Need to provide list of people for group";
            res.send(data);
            return;
        }

        let maxMemberCount = 20;
        if (peopleEmaiList.length > maxMemberCount) {
            data.success = false;
            data.errorMessage = `Group to large! Maximum of ${maxMemberCount} people per group. Study smart!`;
            res.send(data);
            return;
        }
        
        let creatorUserId = firstUserId;

        User.findById(creatorUserId)
        .then((foundCreatorUser) => {
            if (!foundCreatorUser) {
                console.log('ERROR User (creator) not found');
                data.success = false;
                res.send(data)
                return;
            }

            // Add creator user to email list
            peopleEmailList.append(foundCreatorUser.email);

            ChatHistory.create({
                messages: []
            }).then((createdChatHistory) => {
                console.log('created new chat history');
                console.log(createdChatHistory);
                let groupName = groupNameParam;
                Namespace.create({
                    groupName: groupName,
                    img: 'https://arc.duke.edu/sites/arc.duke.edu/files/resize/site-images/Bio-Studygroups-Image-341x166.png',
                    privateChat: false,
                    privateGroup: true,
                    rooms: [
                        {roomId: 0, roomName: 'General', chatHistory: createdChatHistory.id},
                    ],
                    admins: [
                        creatorUserId
                    ],
                }).then( async (createdNamespace) => {
                    console.log('created new private multi-user group');
                    console.log(createdNamespace);

                    let peopleDetails = []; // Array of people details for namespace
                    let people = []; // Array of people ids for namesapce

                    // Update each member with the new namespace id, also retrieve their information to update namespace
                    for (const memberEmail of peopleEmailList) {
                        await User.findOneAndUpdate(
                            {email: memberEmail},
                            {
                                $push: { "namespaces": createdNamespace.id }
                            },
                            {new: true}
                        ).then((updatedMember) => {
                            if (!updatedMember) {
                                console.log('UNABLE TO FIND/UPDATE MEMBER WITH NEW NAMESPACE');
                                return;
                            }
                            console.log('Updated namespace array of user ' + updatedMember.email);
                            peopleDetails.push(
                                {
                                    name: updatedMember.name,
                                    email: updatedMember.email,
                                    avatar: updatedMember.avatar,
                                    givenName: updatedMember.givenName
                                }
                            );
    
                            people.push(updatedMember.id);

                        }).catch((err) => {
                            console.log(err);
                        });
                    }

                    // Add new fields to namespace to save

                    // Use id as endpoint
                    let groupEndpoint = createdNamespace.id;
                    createdNamespace.endpoint = groupEndpoint;
                    createdNamespace.peopleDetails = peopleDetails;
                    createdNamespace.people = people;

                    // Save namespace with added peopleDetails
                    createdNamespace.save().then((savedNamespace) => {
                        // Send Message to master to dynamically add listeners to all threads for new (dynamic) namespace
                        console.log('Sending newNamespace message to master');
                        let messageToMaster = {
                            newNamespaceRoute: `/namespace${groupEndpoint}`,
                            newNamespaceEndpoint: groupEndpoint,
                            newNamespaceName: groupName
                        }
                        process.send(messageToMaster);

                        data.group = createdNamespace;
                        // Send response
                        res.send(data);

                    }).catch((err) => {
                        console.log(err);
                    });

                }).catch((err) => {
                    console.log(err);
                });

            }).catch((err) => {
                console.log(err);
            });

        }).catch((err) => {
            console.log(err);
        });

    }

}

module.exports = router;