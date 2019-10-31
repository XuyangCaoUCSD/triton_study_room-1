const GoogleStrategy = require('passport-google-oauth20'),
      passport       = require('passport'),
      User           = require('../models/User');
const keys = require('./keys');
const ucsdEmailCheck = require('../utitlities/ucsdMailCheck');

passport.serializeUser((user, done) => {
    // Use unique id generated by mongo to serialise user
    done(null, user.id); // Not _id
});

passport.deserializeUser((id, done) => {
    // Deserialize user given id generated by mongo
    User.findById(id).then((user) => {
        done(null, user.id);
        return;
    }).catch((err) => {
        console.log('Could not find desrialised user');
        return done(err);
    });
});

passport.use(
    new GoogleStrategy({
        clientID: keys.google.clientID,
        clientSecret: keys.google.clientSecret,
        callbackURL: '/api/auth/google/redirect' // Need to be an authorised route in google dev console
    }, (accessToken, refreshToken, profile, done) => {
        // Call done function param if successful
        console.log('profile._json.email is');
        console.log(profile._json.email);

        let email = profile._json.email;
        
        if (ucsdEmailCheck.checkMail(email) === false) {
            return done(null, false, { message: 'Need UCSD email.' });
        }

        // const allowed_domain = "ucsd.edu";
        // console.log(allowed_domain.length);
        // // Check to make sure domain is UCSD account
        // // negative important in slice to get last characters
        // if (email.slice(-allowed_domain.length) != allowed_domain) {
        //     console.log("NOT UCSD ACCOUNT!")
        //     return done(null, false, { message: 'Need UCSD email.' });
        // }


        User.findOne({googleId: profile.id}).then((currentUser) => {
            if (currentUser) {
                // Already have user
                console.log('Existing user is:', currentUser);
                done(null, currentUser);
            } else {
                // Create new
                new User({
                    username: profile.displayName,
                    googleId: profile.id,
                    email: email
                }).save().then((newUser) => {
                    console.log('new user created: ' + newUser);
                    done(null, newUser);
                }).catch((err) => {
                    console.log("Error saving new user to db");
                    console.log(err);
                });
            }
        });
        
    })
);