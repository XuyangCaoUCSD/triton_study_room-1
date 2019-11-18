const redis = require('redis');
// Create and connect redis client to local instance.
const redisClient = redis.createClient(6379)

// Log redis errors to the console
redisClient.on('error', (err) => {
    console.log("Error " + err)
});


redisClient.flushdb( function (err, succeeded) {
    if (err) {
        console.log(err);
        throw err;
    }
    console.log('Clear cache Success:');
    console.log(succeeded); // will be true if successfull
});
