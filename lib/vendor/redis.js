const redis = require('redis');
const path  = require('path');
const config = require(path.resolve(ROOT, 'common/conf/config'));

const redisClient = redis.createClient(config.redis.port, config.redis.host, {
  prefix: config.redis.prefix || ''
});
redisClient.auth(config.redis.auth);

redisClient.exist = (key, callback) => {
	redisClient.get(key, function(err, data) {
	  callback(err || data === null);
	});
}

redisClient.on("error", function (err) {
  console.log("Error " + err);
});

module.exports = redisClient;