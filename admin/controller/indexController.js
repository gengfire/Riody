const authController = require('../common/controller/authController');

module.exports = class Controller extends authController {

  indexAction () {
    const uid = this.session('uid');
    this.exesql(`SELECT username FROM admin WHERE id=${uid}`, ret => {
      this.display(ret[0]);
    });
  }

  // tplAction () {
  //   this.display({name: 'hello'}, 'index/tpl');
  // }

  // detailAction (req, res) {
  //   this.exesql('SELECT title FROM note WHERE id=' + this.param, ret => {
  //     res.send(ret);
  //   });
  // }

  // redisAction (req, res) {
  //   this.redis.set('username', 'test');

  //   this.redis.get('username', function(rq, ret){
  //     res.send(ret);
  //   });
  // }
}