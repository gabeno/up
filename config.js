/**
 *  Create and export environmental variables
 */

const environments = {};

// staging
environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'staging',
  'hashSecret': 'this_is_a_secret',
  'maxChecks': 5,
  'twilio': {
    'accountSID': '',
    'authToken': '',
    'fromPhone': ''
  }
};

// production
environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName': 'production',
  'hashSecret': 'this_is_a_secret',
  'maxChecks': 5,
  'twilio': {
    'accountSID': '',
    'authToken': '',
    'fromPhone': ''
  }
};

// grab env from command line
const currEnv = typeof(process.env.NODE_ENV) == 'string'
  ? process.env.NODE_ENV.toLowerCase()
  : '';

// check that the current environment is defined above
const _env = typeof(environments[currEnv]) == 'object'
  ? environments[currEnv]
  : environments['staging'];

// export environment
module.exports = _env;
