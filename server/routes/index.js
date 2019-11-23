const  express       = require('express'),
       passport      = require('passport'),
       passportSetup = require('../config/passport-setup'), // IMPORTANT: Need to require somewhere to run file so google auth is initialised
       User          = require('../models/User'),
       middleware    = require('../middleware/index');

const redisClient = require('../redisClient');

var router = express.Router();
let namespaces = require('../data/namespaces');  // Temp

// Root route
router.get("/", (req, res) => {
    console.log('Someone connected to root route');
    res.send("You are connected to the root route");
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

            const namespaces = foundUser.namespaces;
            const namespaceNotifications = {}
            
            let nsData = namespaces.map((ns) => {
                return {
                    img: ns.img,
                    endpoint: ns.endpoint,
                    groupName: ns.groupName,
                }
            });

            data.nsData = nsData;
            data.userEmail = foundUser.email;

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
            console.log('Sending: ');
            console.log(data);
        } else {
            getUserNamespaceUnreads(userId, i + 1, namespaces, res, namespaceNotifications, data);
        }
    });
}

module.exports = router;