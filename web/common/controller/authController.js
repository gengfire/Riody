module.exports = class authController {
  constructor (req, res) {
    this.req = req;
  }

  __before (next) {
    if (!this.req.data.token) return this.json('202');

    this.exesql(`SELECT id FROM user WHERE token='${this.req.data.token}'`, ret => {
      if (ret.length === 0) return this.json('401', 'token auth failed');

      next(() => {
        this.uid = ret[0].id;
      });
    });
  }
}