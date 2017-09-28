const mysql = require('mysql');
const path  = require('path');
const config = require(path.resolve(ROOT, 'common/conf/config'));

var pool = mysql.createPool(config.mysql);
exports.exesql = function(sql, callback) {
  const prefix = config.mysql.prefix;
  let sqls = sql;
  if (prefix && prefix !== '') {
    const reg = new RegExp('(FROM|UPDATE|JOIN|INTO)(\\s)(?!'+ prefix +')(\\w+)(\\s)?', 'gi');
    sqls = sql.replace(reg, '$1$2'+ prefix +'$3$4');
  }
  pool.getConnection(function (err, connection) {
    if (err) throw err;

    connection.query(sqls, function (err, rows) {
      if (err) {
        callback(err, err);
      } else {
        callback(rows, err);
      }
      connection.release();
    });
  });
};
