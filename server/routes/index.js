const  express       = require('express'),
       passport      = require('passport'),
       passportSetup = require('../config/passport-setup'), // Need to require to run file so google auth is initialised
       User          = require('../models/User');

var router = express.Router();
let namespaces = require('../data/namespaces');  // Temp

// Root route
router.get("/", (req, res) => {
    console.log('Someone connected to root route');
    res.send("You are connected to the root route");
	// res.render("landing");
});

router.get('/dashboard', isLoggedIn, (req, res) => {
    let data = {
        success: true,
        nsData: null
    }

    // Need to get user's groups from database and send that over
    // Temp
    // Build an array to send back with the img and endpoint for each NS
    let nsData = namespaces.map((ns) => {
        return {
            img: ns.img,
            endpoint: ns.endpoint
        }
    });

    data.nsData = nsData;

    // Send over namespace data along with field indicating success
    res.send(data);
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

function isLoggedIn (req, res, next) {
	if (req.isAuthenticated()) {
        console.log(req.user)
		return next();
    } 

    console.log(req.user);
    console.log(req.session);
	req.flash("error", "You need to be logged in first to do that");  // Key value pair arg to display on next redirect / next route
    
    res.statusMessage = "NOT LOGGED IN!";
    res.status(401);
    res.send("ERROR, NOT LOGGED IN");
}

router.get('/check', isLoggedIn, (req, res) => {
    console.log("Passed validation");
    console.log("User details are");
    console.log(req.user);
    console.log(req.session);
    res.send('Logged In!');
});


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