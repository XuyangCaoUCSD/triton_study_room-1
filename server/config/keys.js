// Add this file to .gitignore

module.exports = {
    google: {
        clientID: '1071807090044-td9fkqdkkrm4fv00p8t0uquefgfqkneu.apps.googleusercontent.com',
        clientSecret: 'xChdSUz3Nn6KB9FeTFj0Jtf6'
    },

    // Session keys for cookies
    session: {
        secret: "Super secret key matey mate" 
    },
    // Eventually mongo db keys should go here too

    mongoDB: {
        connectionURI: "mongodb://localhost:27017/triton_study_room"
    }
};