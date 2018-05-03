/**
 *  Create and export environmental variables
 */

const environments = {};

// staging
environments.staging = {
  'port': 3000,
  'envName': 'staging'
};

// production
environments.production = {
  'port': 3000,
  'envName': 'production'
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