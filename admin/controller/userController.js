module.exports = class Controller {

  loginAction() {
    this.display();
  }

  signinAction(req, res) {
  	const {username, passwd} = req.data;
  	
  	this.exesql(`SELECT id FROM admin WHERE username='${username}' AND passwd=md5('${passwd}')`, ret => {
  		if (ret.length) {
        this.session('uid', ret[0].id);

		    this.json('200', '登录成功', {
		    	url: '/'
		    });
  		} else {
  			this.json('201', '账号或密码错误');
  		}
  	});
  }

  sendAction(req, res) {
    const {userphone} = req.data;
    console.log(req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress);
    this.json('200', req.connection.remoteAddress);
  }
}