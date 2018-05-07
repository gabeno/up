/**
 * Library for storing and editing data
 */

// @TODO refactor to use async/await pattern

// Dependencies
const fs = require("fs");
const path = require("path");

const helpers = require('./helpers');

// container for the module
const lib = {};

lib.BASE_DIR = path.join(__dirname, "/../.data");

// @TODO stat files and dirs to assert they exists

// write data to file
lib.create = (dir, filename, data, cb) => {
  fs.open(`${lib.BASE_DIR}/${dir}/${filename}.json`, "wx", (err, fd) => {
    if (!err && fd) {
      // file accessed, write to it
      const strData = JSON.stringify(data);
      fs.writeFile(fd, strData, err => {
        if (!err) {
          // success
          fs.close(fd, err => {
            if (!err) {
              cb(false);
            } else {
              cb("Error closing file");
            }
          });
        } else {
          cb("Error writing to new file");
        }
      });
    } else {
      cb("Could not create a new file, it may exist!" + err);
    }
  });
};

// read data
lib.read = (dir, filename, cb) => {
  fs.readFile(`${lib.BASE_DIR}/${dir}/${filename}.json`, 'utf8', (err, data) => {
    if (!err) {
      const parsedData = helpers.parseJsonToObject(data);
      cb(false, parsedData);
    } else {
      cb(err, data);
    }
  });
};

// update file
lib.update = (dir, filename, data, cb) => {
  fs.open(`${lib.BASE_DIR}/${dir}/${filename}.json`, "r+", (err, fd) => {
    if (!err && fd) {
      const strData = JSON.stringify(data);
      fs.ftruncate(fd, 0, (err) => {
        if (!err) {
          fs.writeFile(fd, strData, (err) => {
            if (!err) {
              fs.close(fd, err => {
                if (!err) {
                  cb(false);
                } else {
                  cb('Error closing file');
                }             
              });
            } else {
              cb('Error writing to new file');
            }   
          });
        } else {
          cb('Error truncating file');
        }
      });
    } else {
      cb('Could not open the file for updating, it may not exist yet.');
    }
  });
}; 

// delete
lib.delete = (dir, filename, cb) => {
  fs.unlink(`${lib.BASE_DIR}/${dir}/${filename}.json`, err => {
    if (!err) {
      cb(false);
    } else {
      console.log(err)
      const e = new Error('Error deleting file');
      cb(e);
    }
  });
};

// export the container
module.exports = lib;
