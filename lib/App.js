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
    const {ROOT, project, subDir, virtualDir} = base;
    this.config = Object.assign(commonConf, config);

    this.subDir = subDir;
    this.realPath = path.resolve(ROOT, project);
    this.extend = extend;

    this.virtualDir = virtualDir || false;

    this.artOption = Object.assign({}, artOption);

    this.sessions = {};
  }

  start(port) {
    const { config, subDir, realPath, extend, virtualDir } = this;

    http.createServer((req, res) => {
      let realUrl = subDir && req.url.replace(subDir + '/', '') || req.url;

      const fileInfo = path.parse(realUrl);
      res.send = (content = '', statusCode = 200) => {
        this.writeHead(res, statusCode, 'object' === typeof content && this.getContentType('json') || 'text/html');
        res.end('object' === typeof content && JSON.stringify(content) || content);
      };

      res.setTimeout(600000, () => {
        console.log('响应超时.');
        res.send('10 minutes timeout', 404);
      });

      // static
      const notStatic = (virtualDir && realUrl.indexOf(virtualDir) >= 0) || fileInfo.ext === '';
      if (!notStatic) {
        if (fileInfo.name === '' && fileInfo.dir !== config.STATIC_DIR) return res.send(config.NOT_FOUND, 404);

        // assets or html_cache
        fileInfo.ext = fileInfo.ext.replace(/^(\.\w+)(\S+)?/, '$1');
        const fileName = path.join(fileInfo.dir,  fileInfo.name) + fileInfo.ext;
        const filePath = (config.cache && fileInfo.dir !== config.STATIC_DIR) && config.CACHE_DIR + fileName || fileName.substring(1);
        const staticFile = path.resolve(realPath, filePath);

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
          } else if (fileInfo.dir === config.STATIC_DIR || fileInfo.name === 'favicon') {
            // static file or favicon.ico not exist
            this.writeHead(res, 404, this.getContentType(config.CONTENT_TYPE));
            res.write(config.NOT_FOUND);
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
        const cName = curPath[1] && curPath[1] || config.CNAME;
        const fName = curPath[2] && curPath[2] || config.FNAME;
        const param = curPath.slice(3);
        const cPath = path.resolve(path.resolve(realPath, config.CONTROLLER_DIR), cName + config.CONTROLLER_SUFFIX);

        let postData = '';
        req.addListener('data', chunk => {
          postData += chunk;
        });
        // when request is end
        req.addListener('end', () => {

          // cache clear
          if (fName === 'clear' && fName === 'clear') {
            const cacheDir = path.resolve(realPath, config.CACHE_DIR);
            this.deleteFolder(cacheDir, cacheDir);
            return res.send('Clear Cache Succeeded');
          }

          req.data = req.headers['content-type'] === 'application/json' ? JSON.parse(postData) : querystring.parse(postData);

          let controller;
          try {
            controller = require(cPath);

            // extend
            for (let i in extend) {
              controller.prototype[i] = extend[i];
            };

            // just write
            controller.prototype.echo = (content) => {
              this.writeHead(res);
              res.write('object' === typeof content && JSON.stringify(content) || content);
            }
            // redirect
            controller.prototype.redirect = path => { this.redirect(res, path); }
            // url search
            controller.prototype.query = querystring.parse(purl.query);
            // url param >first
            controller.prototype.param = param[0] || null;
            // url params > array
            controller.prototype.params = param || [];
            // set/get cookies
            controller.prototype.cookie = (key, val, expire) => this.cookie(req, res, key, val, expire);
            // set/get session
            controller.prototype.session = (key, val) => this.session(req, res, key, val);
            // log
            controller.prototype.log = (str, type) => { this.log(str, type); }

            controller = new controller(req, res);

            // return json width status
            controller.json = res.json = (data, status, msg) => res.send(this.json(data, status, msg));
            // res end
            controller.end = () => res.end();
          } catch(e) {
            console.log(e);
          }
          if ('undefined' === typeof controller || 'function' !== typeof controller[fName + config.ACTION_SUFFIX]) {
            return res.send(config.NOT_FOUND, 404);
          }

          // tpl render
          controller.display = (renderData = {}, tplDir) => {
            const assignData = Object.assign({
              ROOT: subDir && ('/' + subDir) || ''
            }, renderData);
            this.display(assignData, tplDir, cName, fName, html => {
              res.send(html);

              // cache
              if (!config.cache) return;

              const cacheDir = path.resolve(realPath, config.CACHE_DIR);
              const fileDir  = path.resolve(cacheDir, cName);
              const paramFix = param.length && '_' + param.join('_') || '';
              const filePath = path.resolve(fileDir, fName + paramFix + config.SUFFIX);

              fs.readFile(filePath, {encoding: 'utf-8'}, (err, data) => {
                // re-write file if mmodify
                if (err || data !== html) {
                  // mkdir
                  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
                  if (!fs.existsSync(fileDir)) fs.mkdirSync(fileDir);
                  // write cache
                  fs.writeFile(filePath, html, err => {
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
              controller[fName + config.ACTION_SUFFIX](req, res);
            });
          } else {
            controller[fName + config.ACTION_SUFFIX](req, res);
          }
        });
      }
    }).listen(port);
    console.log('App start at %s', port);
  }

  display(assignData, tplDir, cName, fName, callback) {
    const { config, artOption, realPath } = this;

    if (artOption.tpl || config.tpl) {
      const tplName = tplDir || path.join(cName, fName);
      const tplPath = path.resolve(path.resolve(realPath, config.VIEWS_DIR), tplName + config.SUFFIX);

      fs.readFile(tplPath, {encoding: 'utf-8'}, (err, data) => {
        if (err) return res.send(config.NOT_FOUND, 404);
        const artTemplete = require('art-template');
        if (artOption.config) artTemplete.config(artOption.config);
        if (artOption.helper) {
          for (let i in artOption.helper) {
            artTemplete.helper(i, artOption.helper[i]);
          }
        }
        artTemplete.helper('urlFix', data => {return this.urlFix(data)});
        artTemplete.config('base', path.resolve(realPath, config.VIEWS_DIR));
        artTemplete.config('openTag', '{{'),
        artTemplete.config('closeTag', '}}'),
        callback(artTemplete.compile(data, {
          'filename': tplName + config.SUFFIX  // for Nodejs get current path, base on base_path
        })(assignData));
      });
    } else {
      callback(config.NOT_FOUND);
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
    option['X-power-by'] = 'Riody 1.3.0';
    res.writeHead(statusCode, option);
  }

  json(data, status = 200, msg) {
    const resCode = this.config.RES_CODE;
    if (typeof data === 'number') {
      return {
        status: data,
        data: resCode[data],
        msg: resCode[data]
      };
    }
    return {
      status: Number(status),
      data,
      msg: msg ? msg : resCode[status]
    };
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
      res.setHeader('Set-Cookie', [`${key}=${val};path=/;Expires=${expireTime};httpOnly=true`]);
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
    const { config, cookie, sessions } = this;

    if (val) {
      // set
      const makeId = new Date().getMilliseconds() + key + Math.random();
      const sessionId = this.cookie(req, res, config.SESSIONKEY) || crypto.createHash('md5').update(makeId).digest('hex');
      this.cookie(req, res, config.SESSIONKEY, sessionId);
      this.sessions[sessionId] = sessions[sessionId] || {};
      this.sessions[sessionId][key] = val;
      return sessionId;
    } else if (key) {
      // get
      const sessionId = this.cookie(req, res, config.SESSIONKEY);
      return sessionId && sessions[sessionId] && sessions[sessionId][key] || null;
    } else {
      // get all
      return sessions;
    }
  }

  log(str, type = 'debug') {
    const date = new Date();
    const logDate = `${date.getFullYear()}-${(date.getMonth()+1)}-${date.getDate()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
    const logData = 'object' === typeof str && JSON.stringify(str) || str;
    const logFile = path.resolve(this.realPath, 'logs/' + type + '.log');
    fs.createWriteStream(logFile, {flags: 'a'}).write(logDate + '> ' + logData + '\r\n');
  }
}

module.exports = App;
