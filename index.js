const ROOT  = global.ROOT = __dirname;
const path  = require('path');
const fn    = require(path.resolve(ROOT, 'common/function/fn'));
const mysql = require(path.resolve(ROOT, 'lib/vendor/mysql'));
const redis = require(path.resolve(ROOT, 'lib/vendor/redis'));

const App = require(path.resolve(ROOT, 'lib/App'));

const app = new App({
	ROOT,
	project: 'web',
	subDir: 'api'
}, {
  fn,
  exesql: mysql.exesql
}, {
	helper: {
		'dateFormat': fn.dateFormat,
		'strLen': fn.strLen
	}
});

app.start(30);