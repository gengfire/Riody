const crypto = require('crypto');
const https = require('https');
const url = require('url');
const querystring = require('querystring');

const fn = {
  now(micro) {
  	return micro && new Date().getTime() || Math.floor(new Date().getTime()/1000);
  },
  md5(str, size) {
    const md5sum = crypto.createHash('md5');
    md5sum.update(String(str));
    const md5str = md5sum.digest('hex');
    if (size === 16) return md5str.substr(8, 16);
    return md5str;
  },
  sha1(str) {
    return crypto.createHash('sha1').update(String(str)).digest('hex');
  },
  randStr() {
    return fn.md5(fn.now() * Math.random());
  },
  rand(start = 0, end = 10) {
    return Math.floor((Math.random() * (end - start)) + start);
  },
	dateFormat(date, format) {
		date = date && new Date(date * 1000) || new Date();
		if (!date || date.toUTCString() === "Invalid Date") return "";

		const week = ["日", "一", "二", "三", "四", "五", "六"];
    const map = {
      "M": date.getMonth() + 1, //月份
      "d": date.getDate(), //日
      "h": date.getHours(), //小时
      "m": date.getMinutes(), //分
      "s": date.getSeconds(), //秒
      "q": Math.floor((date.getMonth() + 3) / 3), //季度
      "S": date.getMilliseconds(), //毫秒
      "W": week[date.getDay()]
    };
    format = format.replace(/([yMdhmsqS])+/g, (all, t) => {
      let v = map[t];
      if(v !== undefined){
        if(all.length > 1){
          v = '0' + v;
          v = v.substr(v.length-2);
        }
        return v;
      } else if (t === 'y'){
        return (date.getFullYear() + '').substr(4 - all.length);
      }
      return all;
    });
    return format;
	},
  date2Time(date, separator = '-') {
    const regExp = new RegExp('[- :]'.replace(/-/g, separator));
    const [yyyy, MM, dd, HH, mm, ss] = date.split(regExp);
    return Date.parse(new Date(yyyy, MM - 1, dd, HH || 0, mm || 0, ss || 0));
  },
	strLen(str, len) {
    const endIndex = parseInt(len);
	  return str.substring(0, endIndex);
	},
  post(uri, param = {}, callback, dataType) {
    const postData = querystring.stringify(param);
    const urlInfo = url.parse(uri);
    const req = https.request({
      hostname: urlInfo.hostname,
      port: urlInfo.port,
      path: urlInfo.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      if (res.statusCode == 200) {
        res.setEncoding('utf8');
        let body = '';
        res.on('data', chunk => {
          body += chunk;
        }).on('end', () => {
          if (dataType === 'json') body = JSON.parse(body);
          callback(body);
        }).on('error', err => {
          callback(err, err);
        });
      } else {
        callback(res.statusCode, 'Error');
      }
    });
    req.write(postData);
    req.end();
  },
  postjson(uri, param = {}, callback, dataType) {
    const postData = JSON.stringify(param);
    const urlInfo = url.parse(uri);
    const req = https.request({
      hostname: urlInfo.hostname,
      port: urlInfo.port,
      path: urlInfo.path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'Content-Length': postData.length
      }
    }, res => {
      if (res.statusCode == 200) {
        res.setEncoding('utf8');
        let body = '';
        res.on('data', chunk => {
          body += chunk;
        }).on('end', () => {
          if (dataType === 'json') body = JSON.parse(body);
          callback(body);
        }).on('error', err => {
          callback(err, err);
        });
      } else {
        callback(res.statusCode, 'Error');
      }
    });
    req.write(postData);
    req.end();
  },
  test(type, value) {
    if (typeof value !== 'String') throw new TypeError('value must be a String');

    switch (type) {
      case 'username' :
        return /^[\u4E00-\u9FA5a-zA-Z]{2,15}$/.test(value);

      case 'cellphone' :
        return /^(13[0-9]{9}|15[012356789][0-9]{8}|18[0-9][0-9]{8}|14[57][0-9]{8}|17[0-9][0-9]{8})$/.test(value);

      case 'telephone' :
        return /^(0\d{2,3})?(\d{7,8})$/.test(value);

      case 'phone' :
        return test('cellphone', value) && test('telephone', value);

      case 'email' :
        return /^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(value);

      case 'chinese' :
        return /^[\u4E00-\u9FA5]+$/.test(value);

      case 'integer' :
        return /^\d+$/g.test(value);

      default :
        throw new Error('test type support username/cellphone/telephone/phone/email/chinese/integer');
    }
  },
  html2Escape(sHtml) {
    if (typeof sHtml !== 'string') return '';
    return sHtml.replace(/\'/g, '&apos;').replace(/[<>&"]/g, c => {
      const arrEntities = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;'
      };
      return arrEntities[c];
    });
  },
  escape2Html(str) {
    const arrEntities = {
      'lt': '<',
      'gt': '>',
      'nbsp': ' ',
      'amp': '&',
      'quot': '"',
      'apos': "'"
    };
    return str.replace(/&(lt|gt|nbsp|amp|quot|apos);/gi, (all, t) => arrEntities[t]);
  },
  json2string(json) {
    const formDataStr = [];
    for (let i in json) {
      formDataStr.push(i +'='+ json[i]);
    }
    return formDataStr.join('&');
  }
}

module.exports = fn;
