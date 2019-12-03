//jshint esversion:8
const  express       = require('express'),
       passport      = require('passport'),
       passportSetup = require('../config/passport-setup'), // IMPORTANT: Need to require somewhere to run file so google auth is initialised
       User          = require('../models/User'),
       Namespace     = require('../models/Namespace'),
       { Calendar }  = require('../models/Calendar');
       middleware    = require('../middleware/index');
       Dibs          = require('../utilities/dibs/dibs.js');

const { StudySessionHistory, Reaction } = require('../models/StudySessionHistory');

const redisClient = require('../redisClient');

var router = express.Router();

let dibs = new Dibs();
dibs.update( () => console.log( "DIBS DATA HAS BEEN UPDATED" ) );

const { Notification } = require("../models/Notification");



// Root route
router.get("/", (req, res) => {
    console.log('Someone connected to root api route');
    res.send("You are connected to the root api route");
	// res.render("landing");
});

router.get('/dashboard', middleware.isLoggedIn, (req, res) => {
    let userId = req.session.passport.user;

    let data = {
        success: true,
        nsData: null,
    }

    // Populate user's nsData
    User.findById(userId).populate('namespaces').exec((err, foundUser) => {
        if (err || !foundUser) {
            console.log(err);
            console.log('User not found')
            data.success = false;
            res.send(data);
        } else {

            // For new users
            if (foundUser.newUser) {
                data.newUser = true;

                User.findByIdAndUpdate(
                    userId,
                    {$set: {newUser: false}},
                    {new: true}
                ).then((updatedUser) => {
                    console.log('Set new user to false');
                }).catch((err) => {
                    console.log(err);
                });
            }

            const namespaces = foundUser.namespaces;
            const namespaceNotifications = {}

            let nsData = namespaces.map((ns) => {
                let peopleDetails = ns.peopleDetails;
                return {
                    img: ns.img,
                    endpoint: ns.endpoint,
                    groupName: ns.groupName,
                    privateChat: ns.privateChat,
                    privateGroup: ns.privateGroup,
                    peopleDetails
                }
            });

            data.nsData = nsData;
            data.userEmail = foundUser.email;

            if (namespaces.length === 0) {
                res.send(data);
                return;
            }
            
            getUserNamespaceUnreads(userId, 0, namespaces, res, namespaceNotifications, data);
           
        }
    });
});

// // Show sign up form
// router.get("/register", (req, res) => {
// 	res.render("register");
// });

// // Handle sign up logic
// router.post("/register", (req, res) => {
//     console.log("Someone is trying to post to /register.");
//     // // Axio posts put 3rd parameters of post in req.query
//     // console.log("Query is")
//     // console.log(req.query);
//     // console.log("Session info are");
//     // console.log(req.session);
//     // console.log(req.session.passport);
//     // console.log("Body is");
//     // console.log(req.body);
//     // console.log("user is")
//     // console.log(req.user);
//     let username = req.body.username;
//     let password = req.body.password;
// 	let newUser = new User({username});
// 	User.register(newUser, password, (err, user) => {
// 		if (err) {
// 			console.log(err);
//             req.flash("error", err.message);
//             return res.send(err.message);
// 		}
// 		passport.authenticate("local")(req, res, () => {
//             req.flash("success", "Welcome" + user.username);
//             console.log("Authenticated user " + user.username);
// 			res.redirect("/check");
// 		});
// 	});
// });

router.get('/check', middleware.isLoggedIn, (req, res) => {
    console.log("Passed validation");
    console.log("User details are");
    console.log(req.user);
    console.log(req.session);
    res.send('Logged In!');
});

router.get('/isLoggedIn', (req, res) => {
    if (req.isAuthenticated()) {
        res.send("true");
    } else {
        res.statusMessage = 'NOT LOGGED IN';
        res.send("false");
    }
})


// // Show login form
// router.get("/login", (req, res) => {
// 	res.render("login");
// });

// Login logic, using middleware to authenticate
// authenticate takes req.body.password and req.body.username and takes care of logic for us by comparing
// with what we have in db
router.post("/login", passport.authenticate("local",
	{
		successRedirect: "/check",
		failureRedirect: "/check"  // TODO
	}), (req, res) => {
});

// Logout route
router.get("/logout", (req, res) => {
	req.logout();
	req.flash("success", "Logged you out!");
    // res.redirect("/home");
    res.send("LOGGED OUT SUCCESS");
});

router.post('/createStudySession', middleware.isLoggedIn, async (req, res) => {
    console.log(req.body);
    let userId = req.session.passport.user;
    //generate each "reaction" for each user
    let reactions = [];
    for(var i = 0; i < req.body.selectedUsers.length; i++) {
        const currentReaction = new Reaction({
            person: req.body.selectedUsers[i].email,
            name: "",
            reaction: "wait_response",
            avatar: ""
        });

        await User.findOne({"email": req.body.selectedUsers[i].email}).then(function(userData) {
            currentReaction.name = userData.name;
            currentReaction.avatar = userData.avatar;
        }).catch(function(err) {
            console.log(err);
        });

        reactions.push(currentReaction);
    }
    // plus the reaction of the creator
    User.findById(userId).then(function(ownerInfo) {
        reactions.push(new Reaction({
            person: ownerInfo.email,
            name: ownerInfo.name,
            reaction: "creator",
            avatar: ownerInfo.avatar
        }));

        //create the StudySessionHistory
        const studySession = new StudySessionHistory({
            participants: reactions,
            start: new Date(req.body.startTime),
            end: new Date(req.body.endTime),
            location: req.body.location,
            title: req.body.title,
            desc: req.body.desc
        });

        studySession.save().then(function(doc) {
            console.log("successfully saved this study session to db");
            
            //now save this study session to each participant
            for(var n = 0; n < req.body.selectedUsers.length; n++) {
                const notiCard = new Notification({
                    type: "study_session",
                    trigger: studySession._id,
                    extra: "participant",
                    extra2: ""
                });
                User.findOneAndUpdate(
                    {"email": req.body.selectedUsers[n].email},
                    {"$push": {"studySessionsHistory": studySession._id, "request_notification": notiCard}},
                    {safe: true, new: true}
                ).then(function(doc) {
                    console.log("write this study session to one of the users too!");
                    
                }).catch(function(err) {
                    console.log(err);
                });
            }

            const creatorNotiCard = new Notification({
                type: "study_session",
                trigger: studySession._id,
                extra: "creator",
                extra2: ""
            });

            //also save to the creator
            User.findOneAndUpdate(
                {"email": ownerInfo.email},
                {"$push": {"studySessionsHistory": studySession._id, "request_notification": creatorNotiCard}},
                {safe: true, new: true}
            ).then(function(doc) {
                console.log("write this study session to the creator!");
            }).catch(function(err) {
                console.log(err);
            });

            // Update creator's calendar with new event
            let newEvent = {
                title: studySession.title,
                start: studySession.start,
                end: studySession.end,
                location: studySession.location,
                desc: studySession.desc
            }

            Calendar.findByIdAndUpdate(
                ownerInfo.calendar,
                {$push: {events: newEvent}}
            ).then((updatedCalendar) => {     
                console.log('Added new event to user (creator) ' + ownerInfo.email + "'s calendar");
            }).catch((err) => {
                console.log(err);
            });


            res.send("Created this study session!!");
        }).catch(function(err) {
            console.log(err);
        });
    }).catch(function(err) {
        console.log(err);
    });

    
});


router.get("/setting/dataRetrieve", middleware.isLoggedIn, function(req, res) {
    let userId = req.session.passport.user;
    User.findById(userId).then(function(userData) {
        let to_be_sent = {
            aboutMe: userData.aboutMe,
            phone: userData.phone,
            firstName: userData.givenName,
            lastName: userData.familyName
        };

        res.send(to_be_sent);
    }).catch(function(err) {
        console.log(err);
    })
});

router.post("/setting", middleware.isLoggedIn, function(req, res) {
    let userId = req.session.passport.user;
    console.log(req.body);

    //update the user's aboutMe and phone number
    User.updateOne({"_id": userId}, {"$set": {"aboutMe": req.body.aboutMe}}).exec().then(function(doc) {
        User.updateOne({"_id": userId}, {"$set": {"phone": req.body.phone}}).exec().then(function(doc) {
            console.log("user profile is updated");
            res.send("database is successfully updated!");
        }).catch(function(err) {
            console.log(err);
        });

    }).catch(function(err) {
        console.log(err);
    });

});

router.get("/simpleEmailRetrieve", middleware.isLoggedIn, function(req, res) {
    const userId = req.session.passport.user;
    User.findById(userId).then(function(myData) {
        res.send({
            myEmail: myData.email
        });
    }).catch(function(err) {
        console.log(err);
    });
});


// this route will retrieve all the users in our app
router.get("/userSearch", middleware.isLoggedIn, function(req, res) {
  console.log('SEARCH DATA ROUTE REACHED');
	let userId = req.session.passport.user;
	User.findById(userId).then(function(foundUser) {
		let friendList = foundUser.friends;
        //then get all users
        console.log(foundUser);
        console.log('FRIENDS LIST: ');
        console.log(friendList);

	    User.find({}).then(function(data) {

            let to_be_sent = [];

			for(var i = 0; i < data.length; i++) {

				let user = {
					title: (data[i].name),
					about_me: data[i].aboutMe,
					avatar: data[i].avatar,
					email: data[i].email,
                    is_friend: "",
					// db_id: data[i]._id
				};


				if (friendList.indexOf(data[i]._id) != -1) {
					user.is_friend = "A friend of yours";
				} else {
					if (data[i]._id == userId) {
                        user.is_friend = "Yourself";
                    } else {
                        user.is_friend = "Not your friend yet";
                    }
                }

				to_be_sent.push(user);

			}

			console.log(to_be_sent);
			res.send(to_be_sent);
		}).catch(function(err) {
			console.log(err);
		});


	}).catch(function(err) {
		console.log(err);
	});

});

router.get("/userSearch/:endpoint", middleware.isLoggedIn, async (req, res) => {
    let to_be_sent = [];
    let userId = req.session.passport.user;
    let endpoint = "/"+req.params.endpoint;
    console.log(endpoint);

    User.findById(userId).then( async function(foundUser) {
        let friendList = foundUser.friends;
        if(endpoint === "/friend") {
            for(var i = 0; i < friendList.length; i++) {
                await User.findById(friendList[i]).then(function(friendData) {
                    let user = {
                        title: friendData.name,
                        about_me: friendData.aboutMe,
                        avatar: friendData.avatar,
                        email: friendData.email,
                        is_friend: "A friend of yours"
                    };

                    to_be_sent.push(user);
                }).catch(function(err) {
                    console.log(err);
                });  
            }

            res.send(to_be_sent);
        }
        //if the endpoint is customized
        else if(endpoint !== "/global") {
            
            Namespace.findOne({"endpoint": endpoint}).then( async function(spaceInfo) {
                console.log(spaceInfo.people);
                for(var i = 0; i < spaceInfo.people.length; i++) {
                //now find each user
                await User.findOne({"_id": spaceInfo.people[i]}).then(function(userData) {
                    let user = {
                        title: (userData.name),
                        about_me: userData.aboutMe,
                        avatar: userData.avatar,
                        email: userData.email,
                        is_friend: "",
                    };
    
                    //check friend
                    if (friendList.indexOf(userData._id) != -1) {
                        user.is_friend = "A friend of yours";
                        to_be_sent.push(user);
                    } else {
                        if (userData._id == userId) {
                            // user.is_friend = "Yourself";
                            // skip self
                            
                        } else {
                            user.is_friend = "Not your friend yet";
                            to_be_sent.push(user);
                        }
                    }
    
                    
    
                    }).catch(function(err) {
                    console.log(err);
                    });
                }
    
                res.send(to_be_sent);
    
    
            }).catch(function(err) {
            console.log(err);
            });
        }
        //otherwise find all users
        else {

            User.find({}).then(function(data) {
    
                for(var i = 0; i < data.length; i++) {
    
                    let user = {
                        title: (data[i].name),
                        about_me: data[i].aboutMe,
                        avatar: data[i].avatar,
                        email: data[i].email,
                        is_friend: "",
                        // db_id: data[i]._id
                    };
    
    
                    if (friendList.indexOf(data[i]._id) != -1) {
                        user.is_friend = "A friend of yours";
                    } else {
                        if (data[i]._id == userId) {
                            // user.is_friend = "Yourself";
                            continue;
                        } else {
                            user.is_friend = "Not your friend yet";
                        }
                    }
    
                    to_be_sent.push(user);
    
                }
    
                console.log(to_be_sent);
                res.send(to_be_sent);
            }).catch(function(err) {
                console.log(err);
            });

        }

    }).catch(function(err) {
        console.log(err);
    });
});

router.post("/multiUserSubmit", middleware.isLoggedIn, function(req, res) {
    //yourself
    console.log(req.body);
    let userId = req.session.passport.user;
    //selected other user. now add the user self to the list
    selectedUsers = req.body.selectedUser;
    User.findOne({"_id": userId}).then(function(userSelf) {
        let user = {
            title: (userSelf.name),
            about_me: userSelf.aboutMe,
            avatar: userSelf.avatar,
            email: userSelf.email,
            is_friend: "Yourself",
            // db_id: data[i]._id
        };

        selectedUsers.push(user);

        console.log("these user will form a group: "+JSON.stringify(selectedUsers));

        //Now begin processing those selected user data...
        

        res.send("successfully get your multiUserSelection!");

    }).catch(function(err) {

    });
    
  
  });




router.post("/userAdd", middleware.isLoggedIn, function(req, res) {
  let userId = req.session.passport.user;
  let receiverEmail = req.body.send_to_email;

  //generate a "friend_request" notification for the receiver
  const friendRequest = new Notification({
    type: "friend_request",
    trigger: userId,
    extra: "",
    extra2: ""
  });

  User.updateOne({"email": receiverEmail}, {"$push": {"request_notification": friendRequest}}).exec().then(function(doc) {
    console.log("successfully sent the friend request");
  }).catch(function(err) {
    console.log(err);
  });

  res.send("successfully sent the friend request");

});


router.get("/NotiCenter", middleware.isLoggedIn, function(req, res) {
    let userId = req.session.passport.user;
    User.findById(userId).then(async function(data){
        const cards = data.request_notification;
        let to_be_sent = [];
        //before sending the data, we also add the trigger's name to each card (since we need to display the name rather than the id)
        for(var i = 0; i < cards.length; i++) {
            card = {
              type: cards[i].type,
              trigger: cards[i].trigger,
              extra: "",
              extra2: "",
              _id: cards[i]._id,
              avatar: "",
              triggerEmail: "",
              spaceCreatorName: cards[i].extra,
              listOfReactions: [],
              yourReaction: "",
              desc: "",
              location: "",
              start: null,
              end: null
            }
            // case for adding friend
            if(card.type === "friend_request" || card.type === "friend_accepted") {
                await User.findById(cards[i].trigger).then(function(triggerData) {
                    card.extra = triggerData.name;
                    card.avatar = triggerData.avatar;
                    card.triggerEmail = triggerData.email;
                    to_be_sent.push(card);
                    if (i == cards.length - 1) {
                      res.send(to_be_sent);
                    }
                  }).catch(function(err) {
                    console.log(err);
                  });
            }
            // case for namespace invitation
            else if(card.type === "namespace_invite") {
                //for namespace_invite, the trigger is the newly-created namespace objectId
                await Namespace.findById(cards[i].trigger).then(function(triggerData) {
                    card.extra = triggerData.groupName;
                    card.extra2 = triggerData.endpoint;
                    card.avatar = triggerData.img;
                    to_be_sent.push(card);
                    if (i == cards.length - 1) {
                      res.send(to_be_sent);
                    }
                  }).catch(function(err) {
                    console.log(err);
                  });
            }
            // case for study session invitation
            else if(card.type === "study_session") {
                card.avatar = "http://localhost:8181/api/uploads/avatars/study.jpeg";
                // protocol: directly copy your role: (if you are participant or creator)
                card.extra = cards[i].extra;

                // get all users' reactions
                await StudySessionHistory.findById(cards[i].trigger).then(async function(sessionInfo) {
                    card.listOfReactions = sessionInfo.participants;
                    card.extra2 = sessionInfo.title;
                    card.desc = sessionInfo.desc;
                    card.location = sessionInfo.location;
                    card.start = sessionInfo.start;
                    card.end = sessionInfo.end;
                    // and if you are not the creator, we collect your reaction here so how it should be rendered can be
                    // immediately decided on the front end
                    if(card.extra === "participant") {
                        await User.findById(userId).then(function(yourself) {
                            for(var p = 0; p < sessionInfo.participants.length; p++) {
                                if(yourself.email === card.listOfReactions[p].person) {
                                    
                                    card.yourReaction = sessionInfo.participants[p].reaction;
                                    card.listOfReactions[p].person = "yourselfDiscovered";
                                    console.log("reached if statement!!!");
                                    break;
                                }
                            }
                        }).catch(function(err) {
                            console.log(err);
                        });
                    }

                    to_be_sent.push(card);
                    console.log(card);
                    if (i === cards.length - 1) {
                        res.send(to_be_sent);
                    }
                }).catch(function(err) {
                    console.log(err);
                });
            }






          }
    }).catch(function(err) {
        console.log(err);
    });
});

router.post("/NotiCenter/consumeCard", middleware.isLoggedIn, function(req, res) {
  console.log(req.body);
  let userId = req.session.passport.user;
  // update based on the card type and user's choice
  if(req.body.type === "friend_request") {
    // when the user accepted the friend request
    if(req.body.choice === "accepted") {
      // add the sender to the receiver's friend list
      User.updateOne({"_id": userId}, {"$push": {"friends": req.body.trigger}}).exec().then(function(doc) {
        // add the receiver to the sender's friend list
        User.updateOne({"_id": req.body.trigger}, {"$push": {"friends": userId}}).exec().then(function(doc) {
          // generate a "request_accepted" notification card to the sender
          const friendAccepted = new Notification({
            type: "friend_accepted",
            trigger: userId,
            extra: "",
            extra2: ""
          });
          User.updateOne({"_id": req.body.trigger}, {"$push": {"request_notification": friendAccepted}}).exec().then(function(doc) {
            //friends are added and notification is sent
            console.log("friends are added and notification is sent");
          }).catch(function(err) {
            console.log(err)
          });

        }).catch(function(err) {
          console.log(err);
        });
      }).catch(function(err) {
        console.log(err);
      });
    }

    //else if the user declined the friend request we will just ignore it and delete this notification
  }
  else if(req.body.type === "study_session") {
      User.findById(userId).then(function(userData) {
        const userEmail = userData.email;

        StudySessionHistory.findById(req.body.trigger).then(function(sessionInfo) {
            for(var q = 0; q < sessionInfo.participants.length; q++) {
                if(sessionInfo.participants[q].person === userEmail) {
                    let updatedParticipants = sessionInfo.participants;
                    if(req.body.choice === "accepted") {
                        updatedParticipants[q].reaction = "accept";

                        // Update event in calendar
                        let newEvent = {
                            title: sessionInfo.title,
                            start: sessionInfo.start,
                            end: sessionInfo.end,
                            location: sessionInfo.location,
                            desc: sessionInfo.desc
                        }
            
                        Calendar.findByIdAndUpdate(
                            userData.calendar,
                            {$push: {events: newEvent}}
                        ).then((updatedCalendar) => {     
                            console.log('Added new event to user ' + userData.email + "'s calendar");
                        }).catch((err) => {
                            console.log(err);
                        });
                    }
                    else if(req.body.choice === "declined") {
                        updatedParticipants[q].reaction = "reject";
                    }
                    StudySessionHistory.findOneAndUpdate(
                        {"_id": req.body.trigger},
                        {"$set": {"participants": updatedParticipants}},
                        {safe: true, new: true}
                    ).then(function(doc) {
                        console.log("updated your reaction!!");
                    }).catch(function(err) {
                        console.log(err);
                    });
                }
            }

        }).catch(function(err) {
            console.log(err);
        });
        
      }).catch(function(err) {
          console.log(err);
      });
  }





  //and we consume (delete) this notification (except the study session case)
  if(req.body.type !== "study_session") {
    User.updateOne({"_id": userId}, {"$pull": {"request_notification": {"_id": req.body.cardId}}}).exec().then(function(doc) {
        console.log("notification card is deleted.");
      }).catch(function(err) {
        console.log(err);
      });
  }

  res.send("successfully updated the database and consumed the notification");
});




// TODO this route will grab DIBS buildings from the API
router.get("/dibsAllBuildings", middleware.isLoggedIn, function(req, res) {
    console.log('DIBS ALL BUILDINGS ROUTE REACHED');
    var ret = [];
    dibs.getBuildings().map( building => ret.push( building ) );
    res.send( ret );
});

// TODO this route will grab DIBS rooms from the API
router.get("/dibsAllRooms", middleware.isLoggedIn, function(req, res) {
    console.log('DIBS ALL ROOMS ROUTE REACHED');
    var ret = [];
    dibs.getRooms().map( room => ret.push( room ) );
    res.send( ret );
});

// TODO this route will grab a specific DIBS building from the API
router.post("/dibsBuilding", middleware.isLoggedIn, function(req, res) {
    console.log('DIBS BUILDING ROUTE REACHED');
    res.send( dibs.getBuildingByID( req.body.building_id ) );
});

// TODO this route will grab a specific DIBS room from the API
router.post("/dibsRoom", middleware.isLoggedIn, function(req, res) {
    console.log('DIBS ROOM ROUTE REACHED');
    res.send( dibs.getRoomByID( req.body.room_id ) );
});

// TODO this route will find all DIBS rooms open during the given time frame
router.post("/dibsAvailableRooms", middleware.isLoggedIn, function(req, res) {
    console.log('DIBS AVAILABLE ROOMS ROUTE REACHED');

    //These will be ISO strings
    const start = req.body.start;
    const end = req.body.end;



    let rooms = dibs.getRooms();

    for( const room of rooms ) {
        dibs.getRoomAvailableHours( room, year, month, day, function( hours ) {
        })
    }

    res.send( dibs.getRoomByID( req.body.room_id ) );
});


// Recursive call function over namespaces to ensure callback chaining for redis calls for namepsace unreads
function getUserNamespaceUnreads(userId, i, namespaces, res, namespaceNotifications, data) {
    // Check in cache if there is unread messages for this user in this room
    let namespace = namespaces[i];
    redisClient.hget(`${namespace.endpoint} Unreads`, userId, function (error, result) {
        if (error) {
            console.log(error);
            // throw error;
            return;
        }

        console.log(`${namespace.endpoint} Unreads for ${userId} is `);
        console.log(result);

        // Care as result is of type string so not boolean
        // If there are unread messages, set to true, else false
        namespaceNotifications[namespace.endpoint] = result == 'true' ? true : false;

        // Send response on last namespace
        if (i === namespaces.length - 1) {

            // console.log('nsData is');
            // console.log(nsData);

            data.namespaceNotifications = namespaceNotifications;

            // Todo Put in last callback / promise resolution needed for information retrieval
            // Send over namespace data 
            res.send(data); 
            // console.log('Sending: ');
            // console.log(data);
        } else {
            getUserNamespaceUnreads(userId, i + 1, namespaces, res, namespaceNotifications, data);
        }
    });
}

function get_user_data(person_id) {
    return User.findById(person_id).then(function(data) {
        if(!data) {
            console.log("no user data found given the id!");
            return -1;
        }
        return data;
    }).catch((err) => {
        console.log(err);
    });
}

function get_all_user_data() {
    return User.find({}).then(function(data) {
        if(data.length === 0) {
            console.log("no user data found!");
            return -1;
        }
        return data;
    }).catch((err) => {
        console.log(err);
    });
}


function generateDateObject(timeString) {
    const year = Number(timeString.substring(0, 4));
    // Date's month ranges from 0 (Jan) to 11 (Dec)
    const month = Number(timeString.substring(5, 7)) - 1;
    const day = Number(timeString.substring(8, 10));
    const hours = Number(timeString.substring(11, 13));
    const minutes = Number(timeString.substring(14, 16));
    return new Date(year, month, day, hours, minutes);
}

module.exports = router;