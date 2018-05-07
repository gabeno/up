/**
 * Request handlers
 */

// dependencies
const _data = require("./data");
const helpers = require("./helpers");

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
              console.log(err);
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

// @TODO only allow authenticated users to access their user objects
handlers._users.get = (data, callback) => {
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 10
    ? data.queryStringObject.phone.trim()
    : false;

    if (phone) {
      _data.read('users', phone, (err, data) => {
        if (!err && data) {
          // remove the hashedPassword
          delete data.hashedPassword;
          callback(200, data);
        } else {
          callback(404);
        }
      });
    } else {
      callback(400, {'Error': 'Missing required field'});
    }
};

// @TODO only allow authenticated users to access their user objects
handlers._users.put = (data, callback) => {
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10
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
        _data.read('users', phone, (err, userData) => {
          if (!err && userData) {
            // update fields as necessary
            if (firstName) userData.firstName = firstName;
            if (lastName) userData.lastName = lastName;
            if (password) userData.hashedPassword = helpers.hash(password);
            // store user
            _data.update('users', phone, userData, (err) => {
              if (!err) {
                callback(200);
              } else {
                console.log(err);
                callback(500, {'Error': 'Could not update the user'});
              }
            });
          } else {
            callback(400, {'Error': 'The specified user does not exist'});
          }
        });
      } else {
        callback(400, {'Error': 'Missing fields to update'});
      }
    } else {
      callback(404, {'Error': 'Missing required field'});
    }
};

handlers._users.delete = (data, callback) => {};

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
