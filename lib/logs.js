/**
 * Library for storing and rotating logs
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const lib = {};

// base dir
lib.baseDir = path.join(__dirname, '/../.logs/');

// Append a string to a file, create the file if it does not exist
lib.append = (file, str, cb) => {
  fs.open(`${lib.baseDir}.log`, 'a', (err, fd) => {
    if (!err && fd) {
      fs.appendFile(fd, `${str}\n`, err => {
        if (!err) {
          fs.close(fd, err => {
            if (!err) {
              cb(false);
            } else {
              cb('Error closing file that was being appended');
            }
          });
        } else {
          console.log('Error appending to file')''
        }
      });
    } else {
      console.log('Could not open file for appending');
    }
  });
};

// List all the logs, and optionally include compressed logs
lib.list = (includeCompressedLogs = false, cb) => {
  fs.readdir(lib.baseDir, (err, data) => {
    if (!err && data && data.length) {
      let trimmedFilenames = [];
      data.forEach(filename => {
        // add .log files
        if (filename.indexOf('.log') > -1) {
          trimmedFilenames.push(filename.replace('.log', ''));
        }
        // add .gz.b64 files
        if (filename.indexOf('.gz.b64') && includeCompressedLogs) {
          trimmedFilenames.push(filename.replace('.gz.b64', ''));
        }
      });
      cb(false, trimmedFilenames);
    } else {
      cb(err, data);
    }
  });
};

// Compress the contents of .log file into .gs.b64 file within the same directory
lib.compress = (logId, newField, cb) => {
  const source = `${logId}.log`;
  const dest = `${newFileId}.bz.64`;

  fs.readFile(`${lib.baseDir}${source}`, 'utf8', (err, inputStr) => {
    if(!err && inputStr) {
      // compress data using gzip
      zlib.gzip(inputStr, (err, buffer) => {
        if(!err && buffer) {
          // send data to destination file
          fs.open(`${lib.baseDir}${destination}`, 'wx', (err, fd) => {
            if (!err && fd) {
              fs.writeFile(fd, buffer.toString('base64'), err => {
                if (!err) {
                  fs.close(fd, err => {
                    if (!err) {
                      cb(false);
                    } else {
                      cb(err);
                    }
                  });
                } else {
                  cb(err);
                }
              });
            } else {
              cb(err);
            }
          });
        } else {
          cb(err);
        }
      });
    } else {
      cb(err);
    }
  });
};

// Decompress the contents of a .gz compressed file into a string variable
lib.decopmress = (fileId, cb) => {
  const file = `${fileId}.gz.b64`;
  fs.readFile(`${lib.baseDir}${fileId}`, 'utf8', (err, str) => {
    if (!err && str) {
      // Inflate the data
      const inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, (err, outputBuffer) => {
        if(!err && outputBuffer) {
          const outputStr = outputBuffer.toString();
          cb(false, outputStr);
        } else {
          cb(err);
        }
      });
    } else {
      cb(err);
    }
  });
};

// Truncate a log file
lib.truncate = (logId, cb) => {
  fs.truncate(`${lib.baseDir}${logId}.log`, 0, err => {
    if (!err) {
      cb(false);
    } else {
      cb(err);
    }
  });
};

module.exports = lib;
