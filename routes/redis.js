
// redis init (persistent data game)
var redis = require("redis");
exports.client = redis.createClient({'parser': 'javascript', 'return_buffers': true});
exports.client.on("error", function (err) {
    console.log("Error " + err);
});
