const crypto = require('crypto');

const fn = {
  now:(type) => {
    return type && new Date().getTime() || Math.floor(new Date().getTime()/1000);
  },
  md5:(str) => {
    const md5sum = crypto.createHash('md5');
    md5sum.update(String(str));
    return md5sum.digest('hex');
  },
  randStr: () => {
    return fn.md5(fn.now() * Math.random());
  },
  log:(str) => {

  },
  dateFormat(date, format) {
    date = new Date(date * 1000);
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
  strLen(str, len) {
    const endIndex = parseInt(len);
    return str.substring(0, endIndex);
  }

}

module.exports = fn;