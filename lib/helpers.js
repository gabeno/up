/**
 * Helpers for various tasks
 */

const crypto = require('crypto');
const https = require('https');
const querystring = require('querystring');

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

// send an sms via Twilio
helpers.sendTwilioSms = (phone, msg, callback) => {
  // validate params
  const phone = typeof(phone) == 'string' && phone.trim().length == 10
    ? phone.trim()
    : false;
  const msg = typeof(msg) == 'string' && msg.trim().length > 0 && msg.trim().length < 1600
    ? msg.trim()
    : false;

  if (phone && msg) {
    const payload = {
      'From': config.twilio.fromPhone,
      'To': `+1${phone}`,
      'Body': msg
    };
    const strPayload = querystring(payload);
    const requestDetails = {
      'protocol': 'https:',
      'hostname': 'api.twilio.com',
      'method': 'POST',
      'path': `/2010-04-01/Accounts/${config.twilio.accountSID}/Messages.json`,
      'auth': `${config.twilio.accountSID}:${config.twilio.authToken}`,
      'headers': {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(strPayload)
      }
    };

    const req = https.req(requestDetails, (res) => {
      const status = res.statusCode;
      if(status == 200 || status == 201) {
        callback(false);
      } else {
        callback(`Status code returned was ${status}`);
      }
    });

    req.on('error', (e) => {
      callback(e);
    });

    //Add payload
    red.write(strPayload);

    // End the request
    req.end();

  } else {
    callback(err, 'Given parameters were invalid');
  }
};

module.exports = helpers;
