/**
 * Helpers for various tasks
 */

const crypto = require('crypto');

const config = require('../config');

const helpers = {};

// create a SHA256 hash
helpers.hash = (str) => {
  if (typeof(str) == 'string' && str.length > 0) {
    const hash = crypto.createHmac('sha256', config.hashSecret)
      .update(str)
      .digest('hex');
    return hash;
  } else {
    return false;
  }
};

// Parse json string to object without throwing
helpers.parseJsonToObject = (str) => {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch(e) {
    return {};
  }
};

// create a string of random alphanumeric characters of given lenght
helpers.createRandomString = (len) => {
  let strLength = typeof(len) == 'number' && len > 0 ? len : false;
  if (strLength) {
    let possibleChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';

    for (let i = 0; i <= strLength; i++) {
      let randomChar = possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
      str += randomChar;
    }

    return str;
  } else {
    return false;
  }
};

module.exports = helpers;