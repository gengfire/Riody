const authController = require('../common/controller/authController');

module.exports = class Controller extends authController {

  listAction() {
    this.exesql('SELECT tb1.title, tb1.id, tb2.cat_name FROM note tb1 LEFT JOIN category tb2 ON tb1.cat_id=tb2.id', ret => {
      this.display({
        list: ret
      });
    });
  }

  editAction() {
    if (!this.param) return this.direct('/post/list');

    this.exesql('');
  }

  addAction() {
  	this.display();
  }
}