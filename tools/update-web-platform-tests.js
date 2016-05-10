var directoryPath = 'test/web-platform-tests/web-animations';
var zipURL = 'https://github.com/w3c/web-platform-tests/archive/master.zip';
var zipDirectoryPath = 'web-platform-tests-master/web-animations';

function clear() {
  return new Promise(function(resolve, reject) {
    console.log('Deleting ' + directoryPath + '...');
    var rimraf = require('rimraf');
    rimraf(directoryPath, function(error) {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function download() {
  return new Promise(function(resolve, reject) {
    console.log('Downloading ' + zipURL + '...');
    var https = require('https');
    var request = https.get(zipURL);
    request.on('error', function(error) {
      console.log(error);
      done(false);
    });
    request.on('response', function(response) {
      console.log('Status code: ' + response.statusCode);
      response.on('data', resolve);
      response.on('error', reject);
    });
  });
}

// Used instead of download for debugging with a local zip file.
function read() {
  var zipPath = 'web-platform-tests-master.zip';
  return new Promise(function(resolve, reject) {
    var fs = require('fs');
    fs.readFile(zipPath, function(error, data) {
      if (error) {
        reject(error);
      } else {
        resolve(data);
      }
    });
  });
}

function unzip(data) {
  return require('jszip').loadAsync(data).then(function(zip) {
    var webAnimationsTests = zip.filter(function(relativePath, zipObject) {
      return !zipObject.dir && relativePath.indexOf(zipDirectoryPath) != -1;
    });
    console.log('Unzipping ' + webAnimationsTests.length + ' files...');
    return webAnimationsTests.map(function(zipObject) {
      var path = zipObject.name.replace(zipDirectoryPath, directoryPath);
      return zipObject.async('string').then(function(content) {
        return {
          path: path,
          content: content,
        };
      });
    });
  });
}

function alterResourcePaths(file) {
  file.content = file.content.replace(/\/resources\//g, '../../../resources/');
  return file;
}

var directoryPromises = {'.': Promise.resolve()};
function ensureParentDirectory(path) {
  var Path = require('path');
  var parentDirectory = Path.dirname(path);
  if (!(parentDirectory in directoryPromises)) {
    directoryPromises[parentDirectory] = ensureParentDirectory(parentDirectory).then(function() {
      return makeDirectory(parentDirectory);
    });
  }
  return directoryPromises[parentDirectory];
}

function makeDirectory(path) {
  return new Promise(function(resolve, reject) {
    var fs = require('fs');
    fs.mkdir(path, function(error) {
      if (error && error.code != 'EEXIST') {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

function writeFile(file) {
  return ensureParentDirectory(file.path).then(function() {
    return new Promise(function(resolve, reject) {
      console.log('Writing file ' + file.path + '...');
      var fs = require('fs');
      fs.writeFile(file.path, file.content, function(error) {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  });
}

module.exports = function() {
  return clear().
    then(download).
    then(unzip).
    then(function(filePromises) {
      return Promise.all(filePromises.map(function(filePromise) {
        return filePromise.
          then(alterResourcePaths).
          then(writeFile);
      }));
    });
};
