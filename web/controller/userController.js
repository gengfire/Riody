const authController = require('../common/controller/authController');

module.exports = class Controller extends authController {
  
  infoAction(req, res) {
    this.exesql(`SELECT username,email FROM user WHERE id='${this.uid}'`, ret => {
      this.json(ret[0]);
    });
  }

  indexAction(req, res) {
    this.display();
  }
}
