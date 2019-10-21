const GoogleStrategy = require('passport-google-oauth20'),
      passport       = require('passport');
const keys = require('./keys');

passport.serializeUser((user, done) => {
    done(null, user.id); // Not _id
});

passport.deserializeUser((id, done) => {
    User.findById(id).then((user) => {
        done(null, user.id);
    }).catch((err) => {
        console.log('Could not find desrialised user');
    });
});

passport.use(
    new GoogleStrategy({
        clientID: keys.google.clientID,
        clientSecret: keys.google.clientSecret,
        callbackURL: '/auth/google/redirect'
    }, (accessToken, refreshToken, profile, done) => {
        console.log('profile is');
        console.log(profile);
        User.findOne({googleId: profile.id}).then((currentUser) => {
            if (currentUser) {
                // Already have user
                console.log('Existing user is:', currentUser);
                done(null, currentUser);
            } else {
                new User({
                    username: profile.displayName,
                    googleId: profile.id
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

// passport.use(new GoogleStrategy({
//     clientID: keys.google.clientID,
//     clientSecret: keys.google.clientSecret,
//     callbackURL: '/auth/google/redirect'
// }, (token, refreshToken, profile, done) => {
//     return done(null, {
//         profile: profile,
//         token: token
//     });
// }));