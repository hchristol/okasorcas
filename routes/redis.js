
// redis init (persistent data game)
var redis = require("redis");
//exports.client = redis.createClient({'parser': 'javascript', 'return_buffers': true, 'detect_buffers': false});
exports.client = redis.createClient(6379,"redisokasorcas");
exports.client.on("error", function (err) {
    console.log("Error " + err);
});
