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

module.exports = router;