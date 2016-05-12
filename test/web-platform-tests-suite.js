// Copyright 2016 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.

'use strict';
(function() {

  function checkResults(passes, failures, expectedFailures) {
    expectedFailures = expectedFailures || {};

    var failedDifferently = false;
    var differentFailures = {};

    var failedUnexpectedly = false;
    var unexpectedFailures = {};

    var passedUnexpectedly = false;
    var unexpectedPasses = [];

    var hasStaleFailureExpectations = false;
    var staleFailureExpectations = [];

    for (var name in failures) {
      var message = failures[name];
      if (name in expectedFailures) {
        if (expectedFailures[name] !== webPlatformTestsFlakyResult && message != expectedFailures[name]) {
          failedDifferently = true;
          differentFailures[name] = message;
        }
      } else {
        failedUnexpectedly = true;
        unexpectedFailures[name] = message;
      }
    }
    for (var name in expectedFailures) {
      if (name in passes) {
        passedUnexpectedly = true;
        unexpectedPasses.push(name);
      } else if (!(name in failures)) {
        hasStaleFailureExpectations = true;
        staleFailureExpectations.push(name);
      }
    }

    var error = new Error('');
    error.stack = null;
    if (hasStaleFailureExpectations) {
      error.message += 'Stale failure expectations, test no longer exists:\n';
      error.message += staleFailureExpectations.map(function(name) { return '  ' + name + '\n'; }).join('');
      error.message += '\n';
    }
    if (passedUnexpectedly) {
      error.message += 'Passed unexpectedly:\n';
      error.message += unexpectedPasses.map(function(name) { return '  ' + name + '\n'; }).join('');
      error.message += '\n';
    }
    if (failedDifferently) {
      error.message += 'Failed differently:\n';
      for (var name in differentFailures) {
        error.message += '  Test: ' + JSON.stringify(name) + '\n';
        error.message += '  Expected: ' + JSON.stringify(expectedFailures[name]) + '\n';
        error.message += '  Actual:   ' + JSON.stringify(differentFailures[name]) + '\n\n';
      }
      error.message += '\n';
    }
    if (failedUnexpectedly) {
      error.message += 'Failed unexpectedly:\n';
      for (var name in unexpectedFailures) {
        error.message += '  Test: ' + JSON.stringify(name) + '\n';
        error.message += '  Failure: ' + JSON.stringify(unexpectedFailures[name]) + '\n\n';
      }
      error.message += '\n';
    }

    if (error.message) {
      return error;
    }
    return null;
  }

  suite('web-platform-tests', function() {
    var iframe;
    setup(function() {
      iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
    });
    teardown(function() {
      document.body.removeChild(iframe);
    });

    assert.isDefined(window.webPlatformTestsList, 'web-platform-tests-list.js must be loaded first.');
    assert.isDefined(window.webPlatformTestsFailures, 'web-platform-tests-failures.js must be loaded first.');

    webPlatformTestsList.forEach(function(path) {
      if (path in webPlatformTestsSkipped) {
        console.log('Skipping: ' + path + ' because: ' + webPlatformTestsSkipped[path]);
        return;
      }
      test(path, function(done) {
        window.initTestHarness = function(child) {
          var failures = {};
          var passes = {};
          child.add_completion_callback(function(results, harness_status) {
            results.forEach(function(result) {
              if (result.status == 0) {
                passes[result.name] = true;
              } else {
                if (result.name in failures) {
                  console.warn(path + ' has duplicate test name: ' + result.name);
                }
                failures[result.name] = result.message;
              }
            });
            done(checkResults(passes, failures, webPlatformTestsFailures[path]));
          });
        };

        iframe.src = 'base/' + path;
      });
    });
  });

})();
