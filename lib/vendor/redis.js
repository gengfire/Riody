const redis = require('redis');
const path  = require('path');
const config = require(path.resolve(ROOT, 'common/conf/config'));
const { host, port = 6379, password, db = 0 } = config.redis;

const redisClient = redis.createClient({
	host,
	port
	password,
	db
});

redisClient.exist = (key, callback) => {
	redisClient.get(key, function(err, data) {
	  callback(err || data === null);
	});
}

redisClient.on("error", function (err) {
  console.log("Error " + err);
});

module.exports = redisClient;
