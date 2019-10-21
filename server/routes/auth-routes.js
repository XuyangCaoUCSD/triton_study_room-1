const  express     = require('express'),
       passport    = require('passport'),
       cors        = require('cors');
       User        = require('../models/User');

const router = express.Router();

var whitelist = ['http://localhost:3000', '*', 'http://localhost:8181']
var corsOptions = {
  origin: function (origin, callback) {
    console.log('origin is');
    console.log(origin);
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

// Auth with google, redirects to consent screen
router.get('/google', passport.authenticate('google', 
    {
        // Scope is what you want to retrieve from user
        scope: ['profile']
    }), (req, res) => {
});

// Callback route for google to redirect to
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    res.send("You reached callback URI");
});

module.exports = router;