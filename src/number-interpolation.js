// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
// limitations under the License.

(function(scope, testing) {

  function parseNumber(string) {
    if (/^\s*[-+]?(\d*\.)?\d+\s*/.test(string))
      return Number(string);
  }

  // FIXME: We will need to support clamping for opacity, etc.
  function mergeNumbers(left, right) {
    return [left, right, function(x) { return x; }];
  }

  scope.parseNumber = parseNumber;
  scope.mergeNumbers = mergeNumbers;

})(webAnimations, testing);
