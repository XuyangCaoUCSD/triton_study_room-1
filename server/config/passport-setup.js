const GoogleStrategy = require('passport-google-oauth20'),
      passport       = require('passport'),
      User           = require('../models/User'),
      { Calendar }   = require('../models/Calendar');
const keys = require('./keys');
const ucsdEmailCheck = require('../utilities/ucsdMailCheck');

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


        User.findOne({googleId: profile.id}).then((currentUser) => {
            if (currentUser) {
                // Already have user in DB
                console.log('Existing user is:', currentUser);
                done(null, currentUser);
            } else {

                // Check if UCSD email
                // if (!ucsdEmailCheck.checkMail(profile._json.email)) {
                //     return done(null, false, { message: 'Need UCSD email.' });
                // }

                console.log('profile is');
                console.log(profile);

                Calendar.create({
                    events: []
                }).then((createdCalendar) => {
                    console.log('Created new calendar for new user');
                    
                    // Create and save new user
                    new User({
                        name: profile._json.name,
                        givenName: profile._json.given_name,
                        familyName: profile._json.family_name,
                        email: profile._json.email,
                        googleId: profile.id,
                        aboutMe: "",
                        phone: "",
                        classes: [],
                        request_notification: [],
                        calendar: createdCalendar.id,

                        // Temp give default namespaces
                        namespaces: [
                            // "5dce55fddbcc431250507b82",
                            // "5dce55fddbcc431250507b86",
                            // "5dce55fddbcc431250507b88"
                        ]
                    }).save().then((newUser) => {
                        console.log('new user created: ' + newUser);
                        done(null, newUser);
                    }).catch((err) => {
                        console.log("Error saving new user to db");
                        console.log(err);
                    });

                }).catch((err) => {
                    console.log(err);
                });

                
                
            }
        });

    })
);
