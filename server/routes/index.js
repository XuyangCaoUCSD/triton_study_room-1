//jshint esversion:8
const  express       = require('express'),
       passport      = require('passport'),
       passportSetup = require('../config/passport-setup'), // IMPORTANT: Need to require somewhere to run file so google auth is initialised
       User          = require('../models/User'),
       Namespace     = require('../models/Namespace');
       middleware    = require('../middleware/index');

const redisClient = require('../redisClient');

var router = express.Router();

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
                    peopleDetails
                }
            });

            data.nsData = nsData;
            data.userEmail = foundUser.email;

            if (!namespaces) {
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
    
        //if the endpoint is customized
        if(endpoint !== "/global") {
            
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


router.get("/NotiCenter", middleware.isLoggedIn, async function(req, res) {
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
              triggerEmail: ""
            }
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
  //and we consume (delete) this notification
  User.updateOne({"_id": userId}, {"$pull": {"request_notification": {"_id": req.body.cardId}}}).exec().then(function(doc) {
    console.log("notification card is deleted.");
  }).catch(function(err) {
    console.log(err);
  });

  res.send("successfully updated the database and consumed the notification");
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

module.exports = router;