const  express       = require('express'),
       passport      = require('passport'),
       passportSetup = require('../config/passport-setup'), // Need to require to run file so google auth is initialised
       User          = require('../models/User'),
       middleware    = require('../middleware/index');

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

            // Todo Put in last callback / promise resolution needed for information retrieval
            // Send over namespace data 
            res.send(data);        
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

module.exports = router;