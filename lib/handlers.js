/**
 * Request handlers
 */

// dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("../config");

// Routing
const handlers = {};

// users handler
handlers.users = (data, callback) => {
  const acceptableMethods = ["get", "put", "delete", "post"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._users = {};
handlers._users.post = (data, callback) => {
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  const tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstName && lastName && password && phone && tosAgreement) {
    _data.read("users", phone, (err, data) => {
      if (err) {
        const hashedPassword = helpers.hash(password);

        if (hashedPassword) {
          const userObj = {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: true
          };

          _data.create("users", phone, userObj, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Could not create the new user" });
            }
          });
        } else {
          callback(500, { Error: "Could not hash the user's password" });
        }
      } else {
        callback(400, {
          Error: "A user with that phone number already exists"
        });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

handlers._users.get = (data, callback) => {
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  const tokenID =
    typeof data.headers.token == "string" ? data.headers.token : false;
  handlers._tokens.verifyToken(tokenID, phone, isTokenValid => {
    if (isTokenValid) {
      if (phone) {
        _data.read("users", phone, (err, data) => {
          if (!err && data) {
            // remove the hashedPassword
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(400, { Error: "Missing required field" });
      }
      //
    } else {
      callback(403, { Error: "Invalid token or Missing required token" });
    }
  });
};

handlers._users.put = (data, callback) => {
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  // optional fields
  const firstName =
    typeof data.payload.firstName == "string" &&
    data.payload.firstName.trim().length > 0
      ? data.payload.firstName.trim()
      : false;
  const lastName =
    typeof data.payload.lastName == "string" &&
    data.payload.lastName.trim().length > 0
      ? data.payload.lastName.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone) {
    if (firstName || lastName || password) {
      const tokenID =
        typeof data.headers.token == "string" ? data.headers.token : false;
      handlers._tokens.verifyToken(tokenID, phone, isTokenValid => {
        if (isTokenValid) {
          _data.read("users", phone, (err, userData) => {
            if (!err && userData) {
              // update fields as necessary
              if (firstName) userData.firstName = firstName;
              if (lastName) userData.lastName = lastName;
              if (password) userData.hashedPassword = helpers.hash(password);
              // store user
              _data.update("users", phone, userData, err => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: "Could not update the user" });
                }
              });
            } else {
              callback(400, { Error: "The specified user does not exist" });
            }
          });
        } else {
          callback(403, { Error: "Invalid token or Missing required token" });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update" });
    }
  } else {
    callback(404, { Error: "Missing required field" });
  }
};

// @TODO: Delete any other data associated with this user
handlers._users.delete = (data, callback) => {
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.trim().length == 10
      ? data.queryStringObject.phone.trim()
      : false;

  if (phone) {
    const tokenID =
      typeof data.headers.token == "string" ? data.headers.token : false;
    handlers._tokens.verifyToken(tokenID, phone, isTokenValid => {
      if (isTokenValid) {
        _data.read("users", phone, (err, data) => {
          if (!err && data) {
            _data.delete("users", phone, err => {
              if (!err) {
                callback(200);
              } else {
                callback(500, { Error: "Could not delete the specified user" });
              }
            });
          } else {
            callback(400, { Error: "Could not find specified user" });
          }
        });
      } else {
        callback(403, { Error: "Invalid token or Missing required token" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// tokens handler
handlers.tokens = (data, callback) => {
  const acceptableMethods = ["get", "put", "delete", "post"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

handlers._tokens = {};

// Require: phone, password
// Optional: None
handlers._tokens.post = (data, callback) => {
  const phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  const password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone && password) {
    _data.read("users", phone, (err, userData) => {
      if (!err && userData) {
        console.log("here...");
        // compare provided password to store one
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // create a new token with a random name, expiration date 1hr into the future
          var tokenID = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObj = {
            tokenID: tokenID,
            expires: expires,
            phone: phone
          };

          // store token
          _data.create("tokens", tokenID, tokenObj, err => {
            if (!err) {
              callback(200, tokenObj);
            } else {
              callback(500, { Error: "Could not create a token" });
            }
          });
        } else {
          callback(400, { Error: "Incorrect password given" });
        }
      } else {
        callback(400, { Error: "Could not find the specified user" });
      }
    });
  } else {
    callback(400, { Error: "Missing required fields" });
  }
};

handlers._tokens.get = (data, callback) => {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// Required: id, extend
// Optional: None
handlers._tokens.put = (data, callback) => {
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  const extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;

  if (id && extend) {
    _data.read("tokens", id, (err, tokenData) => {
      if (!err && tokenData) {
        // check that token is not expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;
          _data.update("tokens", id, tokenData, err => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { Error: "Could not update token" });
            }
          });
        } else {
          callback(400, {
            Error: "The token has already expired and can not be extended"
          });
        }
      } else {
        callback(400, { Error: "Specified token does not exist" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field(s) or Invalid field(s)" });
  }
};

handlers._tokens.delete = (data, callback) => {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    _data.read("tokens", id, (err, data) => {
      if (!err && data) {
        _data.delete("tokens", id, err => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { Error: "Could not delete the specified token" });
          }
        });
      } else {
        callback(400, { Error: "Could not find specified token" });
      }
    });
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

handlers._tokens.verifyToken = (id, phone, callback) => {
  _data.read("tokens", id, (err, tokenData) => {
    if (!err && tokenData) {
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Checks
handlers.checks = (data, callback) => {
  const acceptableMethods = ["get", "put", "delete", "post"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._checks[data.method](data, callback);
  } else {
    callback(405);
  }
};
handlers._checks = {};

// Checks - post
// Required data: protocol, url, method, successCodes, timeoutSeconds
// Optional data: none
handlers._checks.post = (data, callback) => {
  // validate data
  const protocol =
    typeof data.payload.protocol == "string" && (['http', 'https']).indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  const url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url
      : false;
  const method =
    typeof data.payload.method == "string" && (['get', 'post', 'put', 'delete']).indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  const successCodes =
    typeof data.payload.successCodes == "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" && data.payload.timeoutSeconds % 1== 0 && data.payload.timeoutSeconds >=1 && data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;
  const token = typeof data.headers.token == 'string'
    ? data.payload.token
    : false;

  if (protocol && url && method && successCodes && timeoutSeconds) {
    // authenticated user?
    _data.read('tokens', token, (err, tokenData) => {
      if (!err && tokenData) {
        const phone = tokenData.phone;
        _data.read('users', phone, (err, userData)=> {
          if (!err && userData) {
            const userChecks = typeof userData.checks == 'object' && userData.checks instanceof Array
              ? userData.checks
              : [];
            // Verify that the user has less than max allowed per user
            if (userChecks.length < confi.maxChecks) {
              // create checks
              const checkId = helpers.createRandomString(20);
              const checkObj = {
                'id': checkId,
                'method': method,
                'timeoutSeconds': timeoutSeconds,
                'userPhone': phone,
                'protocol': protocol,
                'successCodes': successCodes,
                'url': url
              };

              // persists checks
              _data.create('checks', checkId, checkObj, err => {
                if (!err) {
                  // add check to user data
                  userData.checks = userChecks;
                  userData.checks.push(checkId);
                  _data.update('users', phone, userData, err => {
                    if (!err) {
                      callback(200, checkObj);
                    } else {
                      callback(500, {'Error': 'Could not update the user with the new check'});
                    }
                  });
                } else {
                  callback(500, {'Error': 'Could not create the new check'});
                }
              });
            } else {
              callback(400, {'Error': `User exceeded allowed limit ${config.maxChecks}`})
            }
          } else {
            callback(403);
          }
        });
      } else {
        callback(403)
      }
    });
  } else {
    callback(400, {'Error': 'Missing or Invalid required inputs'});
  }
};

// checks - GET
// Required: id
// Optional: none
handlers._checks.get = (data, callback) => {
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // Look up the check
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        //
        const tokenID =
          typeof data.headers.token == "string" ? data.headers.token : false;
        // verify token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(tokenID, checkData.phone, isTokenValid => {
          if (isTokenValid) {
            callback(200, checkData);
          } else {
            callback(403);
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {'Error': 'Missing required field'});
  }

};

// checks - PUT
// Required: id
// Optional: timeoutSeconds, protocol, url, method, successCodes (one must be provided)
handlers._checks.put = (data, callback) => {
  // validate provided data
  // check user has valid token
  // effect the put action
  //
  // required field
  const id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  // optional fields
  const protocol =
    typeof data.payload.protocol == "string" && (['http', 'https']).indexOf(data.payload.protocol) > -1
      ? data.payload.protocol
      : false;
  const url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url
      : false;
  const method =
    typeof data.payload.method == "string" && (['get', 'post', 'put', 'delete']).indexOf(data.payload.method) > -1
      ? data.payload.method
      : false;
  const successCodes =
    typeof data.payload.successCodes == "object" && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  const timeoutSeconds =
    typeof data.payload.timeoutSeconds == "number" && data.payload.timeoutSeconds % 1 == 0 && data.payload.timeoutSeconds >= 1 && data.payload.timeoutSeconds <= 5
      ? data.payload.timeoutSeconds
      : false;

  if (id) {
    if (protocol || url || method || successCodes || timeoutSeconds) {
      _data.read('checkData', id, (err, checkData) => {
        if (!err && checkData) {
          // verify user token
          const tokenID =
            typeof data.headers.token == "string" ? data.headers.token : false;

          handlers._tokens.verifyToken(tokenID, checkData.phone, isTokenValid => {
            if (isTokenValid) {
              // update the check where necessary
              if (protocol) checkData.protocol = protocol;
              if (url) checkData.url = url;
              if (method) checkData.method = method;
              if (successCodes) checkData.successCodes = successCodes;
              if (timeoutSeconds) checkData.timeoutSeconds = timeoutSeconds;
              // store checks
              _data.update('checks', id, checkData, err => {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, { Error: "Could not update the check" });
                }
              });
            } else {
              callback(403, { Error: "Invalid token or Missing required token" });
            }
          });
        } else {
          callback(400, { Error: "The specified check does not exist" });
        }
      });
    } else {
      callback(400, { Error: "Missing fields to update" });
    }
  } else {
    callback(400, { Error: "Missing required field" });
  }
};

// checks - DELETE
// Required: id
// Optional: none
handlers._checks.delete = (data, callback) => {
  const id =
    typeof data.queryStringObject.id == "string" && data.queryStringObject.id.trim().length == 20
      ? data.queryStringObject.id.trim()
      : false;

  if (id) {
    // lookup the check
    _data.read('checks', id, (err, checkData) => {
      if (!err && checkData) {
        const tokenID =
          typeof data.headers.token == "string" ? data.headers.token : false;
        handlers._tokens.verifyToken(tokenID, checkData.userPhone, isTokenValid => {
          if (isTokenValid) {
            _data.delete('checks', id, (err) => {
              if (!err) {
                _data.read("users", checkData.userPhone, (err, userData) => {
                  if (!err && userData) {
                    // remove checks from userData
                    const userChecks = typeof userData.checks == 'object' && userData.checks instanceof Array
                      ? userData.checks
                      : [];

                    const checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);
                      // re-save user data
                      _data.update('users', checkData.userPhone, userData, (err) => {
                        if (!err) {
                          callback(200);
                        } else {
                          callback(500, {'Error': 'Could not update the user'});
                        }
                      });
                    } else {
                      callback(500, {'Error': 'Could not find the check on the user'});
                    }
                  } else {
                    callback(500, { Error: "Could not find the user who created the check" });
                  }
                });
              } else {
                callback(500, {'Error': 'Could not delete specified check'});
              }
            });
          } else {
            callback(403, { Error: "Invalid token or Missing required token" });
          }
        });
      } else {
        callback(404, {'Error': 'The specified checkID does not exist'});
      }
    });

  } else {
    callback(400, { Error: "Missing required field" });
  }
}


// ping handler
handlers.ping = (data, callback) => {
  callback(200);
};

// notFound handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// export handlers
module.exports = handlers;
