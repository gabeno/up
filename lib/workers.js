/*
 * worker-related tasks
 */

// Dependencies
const fs = require('fs');
const http = require('http');
const https = require('https');
const path = require('path');
const url = require('url');

const _data = require('./data');
const helpers = require('./helpers');

// Instantiate the worker object
const workers = {};

// Sanity check
// @TODO: user joi here
workers.validateCheckData = (checkData) => {
  originalCheckData = typeof(checkdataData) == 'object' && checkdataData !== null ? checkdataData : {};
  checkdataData.id = typeof(checkdataData.id) == 'string' && checkdataData.id.trim().length == 20 ? checkdataData.id.trim() : false;
  checkdataData.userPhone = typeof(checkdataData.userPhone) == 'string' && checkdataData.userPhone.trim().length == 10 ? checkdataData.userPhone.trim() : false;
  checkdataData.protocol = typeof(checkdataData.protocol) == 'string' && ['http','https'].indexOf(checkdataData.protocol) > -1 ? checkdataData.protocol : false;
  checkdataData.url = typeof(checkdataData.url) == 'string' && checkdataData.url.trim().length > 0 ? checkdataData.url.trim() : false;
  checkdataData.method = typeof(checkdataData.method) == 'string' &&  ['post','get','put','delete'].indexOf(checkdataData.method) > -1 ? checkdataData.method : false;
  checkdataData.successCodes = typeof(checkdataData.successCodes) == 'object' && checkdataData.successCodes instanceof Array && checkdataData.successCodes.length > 0 ? checkdataData.successCodes : false;
  checkdataData.timeoutSeconds = typeof(checkdataData.timeoutSeconds) == 'number' && checkdataData.timeoutSeconds % 1 === 0 && checkdataData.timeoutSeconds >= 1 && checkdataData.timeoutSeconds <= 5 ? checkdataData.timeoutSeconds : false;
  // Set the keys that may not be set (if the workers have never seen this check before)
  checkdataData.state = typeof(checkdataData.state) == 'string' && ['up','down'].indexOf(checkdataData.state) > -1 ? checkdataData.state : 'down';
  checkdataData.lastChecked = typeof(checkdataData.lastChecked) == 'number' && checkdataData.lastChecked > 0 ? checkdataData.lastChecked : false;

  // If all checks pass, pass the data along to the next step in the process
  if(checkdataData.id &&
    checkdataData.userPhone &&
    checkdataData.protocol &&
    checkdataData.url &&
    checkdataData.method &&
    checkdataData.successCodes &&
    checkdataData.timeoutSeconds){
    workers.performCheck(checkdataData);
  } else {
    // If checks fail, log the error and fail silently
    console.log('Error: one of the checks is not properly formatted. Skipping.');
}
};

workers.performCheck = () => {
  const checkOutcome = {
    'error': false,
    'responseCode': false
  };
  const outcomeSent = false;
  const parsedUrl = url.parse(`${originalCheckData.protocol}://${originalCheckData.url}`, true);
  const hostname = parsedUrl.hostname;
  const path = parsedUrl.path;

  // construct request
  const requestDetails = {
    'protocol': `${originalCheckData.protocol}:`,
    'hostname': hostname,
    'method': originalCheckData.method.toUpperCase(),
    'path': path,
    'timeout': originalCheckData.timeoutSeconds * 1000
  };

  // instantiate request with respective protocol
  const _uri = originalCheckData.protocol == 'http' ? http : https;
  const req = _uri.request(requestDetails, (res) => {
    const status = res.statusCode;

    // update the checkOutcome and pass the data along
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // bind to error event so that it does not thrown
  req.on('error', err => {
    checkOutcome.error = { 'error': true, 'value': timeout };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // bind to timeout event
  req.on('timeout', err => {
    checkOutcome.error = { 'error': true, 'value': timeout };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  // end the request
  req.end();
};

// Process  the check outcome, update the check data as needed, trigger an
// if needed.
// Special logic for accomodating an alert that has never been tested before
workers.processCheckOutcome = (data, outcome) => {
  // decide if the check is considered up and down
  const state = !checkOutcome.error
    && checkOutcome.responseCode
    && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1
    ? 'up'
    : 'down';

  //decide if an alert is warranted
  const alertWaranted = originalCheckData.lastChecked && originalCheckData.state !== state
    ? true
    : false;

  // update the check data
  let newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // save the updates
  _data.update('checks', newCheckData.id, newCheckData, err => {
    if (!err) {
      if (alertWaranted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log('Check outcome has not changed, no alert needed');
      }
    } else {
      console.log('Error trying to save updates to one of the checks');
    }
  });
};

// Alert the user to a change in their check status
workers.alertUserToStatusChange = (data) => {
  const msg = `Alert: Your check for ${newCheckData.method.toUpperCase()}
    ${newCheckData.protocol}://${newCheckData.url} is
    currently ${newCheckData.state}`;
  helpers.sendTwilioSMS(newCheckData.userPhone, msg, err => {
    if (!err) {
      console.log('Success: User was alerted to status change in their check', msg);
    } else {
      console.log('Error: Could not send an SMS alert to user who had a state change in their check', err);
    }
  });
};

// lookuo all checks, get their data, send to a validator
workers.gatherAllChecks = () => {
  _data.list('checks', (err, checks) => {
    if (!err && checks && checks.length > 0) {
      checks.forEach(check => {
        _data.read('check', (err, data) => {
          if (!err && originalCheckData) {
            // pass to validator
            workers.validateCheckData(originalCheckData);
          } else {
            console.log('Error reading one of the check\'s data');
          }
        });
      });
    } else {
      console.log('Error: Could not find any checks to process');
    }
  });
};

// Timer to intantiate the worker-process once per minute
workers.loop = () => {
  setInterval(() => {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

// Init worker
workers.init = () => {
  // execute all the checks immediately
  workers.gatherAllChecks();

  // call a loop so the checks will execute later on
  workers.loop();
};

// export the worker object
module.exports = workers;
