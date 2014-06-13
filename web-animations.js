// Copyright 2014 Google Inc. All rights reserved.
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

var global = this;
var TESTING = false;

(function() {
  var sources = [
    'src/scope.js', // This must be first.
    'src/interpolation.js',
    'src/property-interpolation.js',
    'src/dimension-interpolation.js',
    'src/number-interpolation.js',
    'src/transform-interpolation.js',
    'src/element-animate.js',
    'src/animation-node.js',
    'src/animation.js',
    'src/effect.js',
    'src/apply.js',
    'src/player.js',
    'src/timeline.js',
  ];

  if (typeof module != 'undefined') {
    module.exports = sources;
    return;
  }

  var scripts = document.getElementsByTagName('script');
  var location = scripts[scripts.length - 1].src.replace(/[^\/]+$/, '');
  sources.forEach(function(src) {
    document.write('<script src="' + location + src + '"></script>');
  });
})();
