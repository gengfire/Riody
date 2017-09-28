module.exports = class authController {
  constructor (req, res) {
    this.req = req;
    this.res = res;
  }

  __before (next) {
    const uid = this.session('uid');
    if (!uid) {
      this.redirect('/user/login');
    } else {
      next(() => {
        this.uid = uid;
      });
    }
  }
}