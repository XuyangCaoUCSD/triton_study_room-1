const  express     = require('express'),
       passport    = require('passport'),
       User        = require('../models/User');

const router = express.Router();

// Auth with google, redirects to consent screen
router.get('/google', passport.authenticate('google', 
    {
        // Scope is what you want to retrieve from user
        scope: ['profile', 'email']
    }), (req, res) => {
});

// Callback route for google to redirect to
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    res.send("Logged in success, reached google callback/redirect route");
});

// var host_save;
// var origin_save;
// function saveRequestHost(req, res, next) {
//     host_save = req.get('host');
//     console.log('host is');
//     console.log(host_save);
//     origin_save = req.get('origin');
//     console.log('origin is');
//     console.log(origin_save);
//     next();
// }


module.exports = router;