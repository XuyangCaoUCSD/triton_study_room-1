const  express       = require('express'),
       User          = require('../models/User'),
       Namespace     = require('../models/Namespace'),
       { Calendar }  = require('../models/Calendar'),
       middleware    = require('../middleware/index');

var router = express.Router();


// /calendar route. Retrieve user's calendar info
router.get('/', middleware.isLoggedIn, (req, res) => {
    let userId = req.session.passport.user;
    console.log("Reached calendar get route");

    let data = {
        success: true
    }

    User.findById(userId).then((foundUser) => {

    }).catch((err) => {
        console.log(err);
    });
   
});


router.patch('/', middleware.isLoggedIn, (req, res) => {
    let userId = req.session.passport.user;
    console.log("Reached calendar put route");

    let data = {
        success: true
    }

    User.findById(userId).then((foundUser) => {

    }).catch((err) => {
        console.log(err);
    });


});

module.exports = router;