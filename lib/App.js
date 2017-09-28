'use strict';

const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const zlib = require('zlib');
const url = require('url');
const querystring = require('querystring');
const path = require('path');
const commonConf = require('./conf/defaults.json');
const config = require(path.resolve(ROOT, 'common/conf/config'));

class App {
  constructor(base, extend = {}, artOption = {}) {
    const {ROOT, project, subDir} = base;
    this.config = Object.assign(commonConf, config);

    this.subDir = subDir;
    this.realPath = path.resolve(ROOT, project);
    this.extend = extend;

    this.artOption = Object.assign({}, artOption);

    this.sessions = {};
  }

  start(port) {
    http.createServer((req, res) => {
      let realUrl = this.subDir && req.url.replace(this.subDir + '/', '') || req.url;

      const fileInfo = path.parse(realUrl);
      res.send = (content = '', statusCode = 200) => {
        this.writeHead(res, statusCode, 'object' === typeof content && this.getContentType('json'));
        res.end('object' === typeof content && JSON.stringify(content) || content);
      };

      // static
      if (fileInfo.ext !== '') {

        if (fileInfo.name === '' && fileInfo.dir !== this.config.STATIC_DIR) return res.send(this.config.NOT_FOUND, 404);

        // assets or html_cache
        fileInfo.ext = fileInfo.ext.replace(/^(\.\w+)(\S+)?/, '$1');
        const fileName = path.join(fileInfo.dir,  fileInfo.name) + fileInfo.ext;
        const filePath = (this.config.cache && fileInfo.dir !== this.config.STATIC_DIR) && this.config.CACHE_DIR + fileName || fileName.substring(1);
        const staticFile = path.resolve(this.realPath, filePath);

        fs.exists(staticFile, exists => {
          if (exists) {
            const acceptEncoding = req.headers['accept-encoding'] || '';
            var raw = fs.createReadStream(staticFile);

            if (acceptEncoding.indexOf('gzip') >= 0) {
              // Gzip
              this.writeHead(res, 200, this.getContentType(fileInfo.ext.slice(1)), 'Gzip');
              raw.pipe(zlib.createGzip()).pipe(res);
            } else {
              this.writeHead(res, 200, this.getContentType(fileInfo.ext.slice(1)));
              raw.pipe(res);
            }
          } else if (fileInfo.dir === this.config.STATIC_DIR || fileInfo.name === 'favicon') {
            // static file or favicon.ico not exist
            this.writeHead(res, 404, this.getContentType(this.config.CONTENT_TYPE));
            res.write(this.config.NOT_FOUND);
            res.end();
          } else {
            // cache file not exist
            this.redirect(res, path.join(fileInfo.dir,  fileInfo.name));
          }
        });
      // C/V
      } else {
        const purl = url.parse(realUrl);
        const curPath = purl.pathname.split('/');
        const cName = curPath[1] && curPath[1] || this.config.CNAME;
        const fName = curPath[2] && curPath[2] || this.config.FNAME;
        const param = curPath.slice(3);
        const cPath = path.resolve(path.resolve(this.realPath, this.config.CONTROLLER_DIR), cName + this.config.CONTROLLER_SUFFIX);

        let postData = '';
        req.addListener('data', data => {
          postData += data;
        });
        // when request is end
        req.addListener('end', () => {

          // cache clear
          if (fName === 'clear' && fName === 'clear') {
            const cacheDir = path.resolve(this.realPath, this.config.CACHE_DIR);
            this.deleteFolder(cacheDir, cacheDir);
            return res.send('Clear Cache Succeeded');
          }

          req.data = req.headers['content-type'] === 'application/json' ? JSON.parse(postData) : querystring.parse(postData);

          let controller;
          try {
            controller = require(cPath);

            // extend
            for (let i in this.extend) {
              controller.prototype[i] = this.extend[i];
            };
            // return json width status
            controller.prototype.json = (code, arg1, arg2) => {
              res.send(this.json(code, arg1, arg2));
            };
            // just write
            controller.prototype.echo = (content) => {
              this.writeHead(res);
              res.write('object' === typeof content && JSON.stringify(content) || content);
            }
            // res end
            controller.prototype.end = () => { res.end() }
            // redirect
            controller.prototype.redirect = path => { this.redirect(res, path); }
            // url search
            controller.prototype.query = querystring.parse(purl.query);
            // url param >first
            controller.prototype.param = param[0] || null;
            // url params > array
            controller.prototype.params = param || [];
            // set/get cookies
            controller.prototype.cookie = (key, val, expire) => { return this.cookie(req, res, key, val, expire); }
            // set/get session
            controller.prototype.session = (key, val) => { return this.session(req, res, key, val); }
            // log
            controller.prototype.log = (str, type) => { this.log(str, type); }

            controller = new controller(req, res);
          } catch(e) {
            console.log(cPath + ' is not existed');
          }
          if ('undefined' === typeof controller || 'function' !== typeof controller[fName + this.config.ACTION_SUFFIX]) {
            return res.send(this.config.NOT_FOUND, 404);
          }

          // tpl render
          controller.display = (renderData = {}, tplDir) => {
            const assignData = Object.assign({
              ROOT: this.subDir && ('/' + this.subDir) || ''
            }, renderData);
            this.display(assignData, tplDir, cName, fName, html => {
              res.send(html);

              // cache
              if (!this.config.cache) return;

              const cacheDir = path.resolve(this.realPath, this.config.CACHE_DIR);
              const fileDir  = path.resolve(cacheDir, cName);
              const paramFix = param.length && '_' + param.join('_') || '';
              const filePath = path.resolve(fileDir, fName + paramFix + this.config.SUFFIX);

              fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
                // re-write file if mmodify
                if (err || data !== html) {
                  // mkdir
                  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
                  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir);
                  // write cache
                  fs.writeFile(filePath, html, function (err) {
                    if (err) console.log(err);
                    console.log('saved: '+ filePath);
                  });
                }
              });
            });
          };

          // execute function
          if ('function' === typeof controller.__before) {
            controller.__before(arg => {
              arg && arg();
              controller[fName + this.config.ACTION_SUFFIX](req, res);
            });
          } else {
            controller[fName + this.config.ACTION_SUFFIX](req, res);
          }
        });
      }
    }).listen(port);
    console.log('App start at %s', port);
  }

  display(assignData, tplDir, cName, fName, callback) {
    if (this.artOption.tpl || this.config.tpl) {
      const tplName = tplDir || path.join(cName, fName);
      const tplPath = path.resolve(path.resolve(this.realPath, this.config.VIEWS_DIR), tplName + this.config.SUFFIX);

      fs.readFile(tplPath, {encoding: 'utf-8'}, (err, data) => {
        if (err) return res.send(this.config.NOT_FOUND, 404);
        const artTemplete = require('art-template');
        if (this.artOption.config) artTemplete.config(this.artOption.config);
        if (this.artOption.helper) {
          for (let i in this.artOption.helper) {
            artTemplete.helper(i, this.artOption.helper[i]);
          }
        }
        artTemplete.helper('urlFix', data => {return this.urlFix(data)});
        artTemplete.config('base', path.resolve(this.realPath, this.config.VIEWS_DIR));
        artTemplete.config('openTag', '{{'),
        artTemplete.config('closeTag', '}}'),
        callback(artTemplete.compile(data, {
          'filename': tplName + this.config.SUFFIX  // for Nodejs get current path, base on base_path
        })(assignData));
      });
    } else {
      callback(this.config.NOT_FOUND);
    };
  }

  urlFix(data) {
    const url = data.split('/').slice(1);
    return ['', url.shift(), url.join('_')].join('/') + this.config.SUFFIX;
  }

  deleteFolder(path, cacheDir) {
    if(fs.existsSync(path)) {
      const files = fs.readdirSync(path);
      files.forEach(file => {
        const curPath = path + '/' + file;
        if(fs.statSync(curPath).isDirectory()) {
          this.deleteFolder(curPath);
        } else {
          fs.unlinkSync(curPath);
        }
      });
      if (path !== cacheDir) fs.rmdirSync(path);
    }
  }

  getContentType(ext) {
    const type = this.config.STATIC_TYPE;
    return type[ext] || type['txt'];
  }

  writeHead(res, statusCode = 200, contentType = 'text/html', isGzip) {
    const option = {};
    option['Content-Type'] = contentType + ';charset=utf-8';
    if (isGzip) option['Content-Encoding'] = 'gzip';
    res.writeHead(statusCode, option);
  }

  json(code, arg1, arg2) {
    const resCode = this.config.RES_CODE;
    let ret = {
      'status': Number(code),
      'msg': 'string' !== typeof arg1 ? (resCode[code] ? resCode[code] : code) : arg1
    };
    if ('string' === typeof arg1) {
      if (arg2) ret.data = arg2;
    } else {
      if (arg1) ret.data = arg1;
    }
    return ret;
  }

  redirect(res, path) {
    res.writeHead(302, {
      'Location': path
    });
    res.end();
  }

  cookie(req, res, key, val, expire = 24 * 60 * 60 * 1000) {
    if (val) {
      // set
      const expireTime = new Date(new Date().getTime() + expire).toGMTString();
      res.setHeader('Set-Cookie', [key +'='+ val + ';path=/;Expires='+ expireTime +';httpOnly=true']);
      return key;
    } else if (key) {
      // get
      const cookies = req.headers.cookie || '';
      const cookieObj = querystring.parse(cookies, '; ');
      return cookieObj && cookieObj[key] || null;
    } else {
      // get all
      const cookies = req.headers.cookie || '';
      return querystring.parse(cookies, '; ');
    }
  }

  session(req, res, key, val) {
    if (val) {
      // set
      const makeId = new Date().getMilliseconds() + key + Math.random();
      const sessionId = this.cookie(req, res, this.config.SESSIONKEY) || crypto.createHash('md5').update(makeId).digest('hex');
      this.cookie(req, res, this.config.SESSIONKEY, sessionId);
      this.sessions[sessionId] = this.sessions[sessionId] || {};
      this.sessions[sessionId][key] = val;
      return sessionId;
    } else if (key) {
      // get
      const sessionId = this.cookie(req, res, this.config.SESSIONKEY);
      return sessionId && this.sessions[sessionId] && this.sessions[sessionId][key] || null;
    } else {
      // get all
      return this.sessions;
    }
  }

  log(str, type = 'debug') {
    const date = new Date();
    const logDate = date.getFullYear()+'-'+(date.getMonth()+1) +'-'+ date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
    const logData = 'object' === typeof str && JSON.stringify(str) || str;
    const logFile = path.resolve(this.realPath, 'logs/' + type + '.log');
    fs.createWriteStream(logFile, {flags: 'a'}).write(logDate + '> ' + logData + '\r\n');
  }
}

module.exports = App;