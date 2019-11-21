const redis = require('redis');

// Create and connect redis client to local instance.
const redisClient = redis.createClient(6379);

// Log redis errors to the console
redisClient.on('error', (err) => {
    console.log("Error " + err)
});

module.exports = redisClient;