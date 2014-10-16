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

  var propertyHandlers = {};

  function propertiesAcceptingCssValue(cssValue) {
    var properties = [];
    var style = document.createElement('div').style;
    for (var property in style) {
      if (style[property] !== '')
        continue;
      var rejected = ['webkit', 'Moz', 'ms', 'animation', 'transition'].some(function(disallowed) {
        return property.indexOf(disallowed) === 0;
      });
      if (rejected)
        continue;
      // style['content'] = 'css value' throws in IE.
      try {
        style[property] = cssValue;
        if (style[property] === cssValue)
          properties.push(property);
      } catch (error) {}
      style[property] = '';
    }
    return properties;
  }

  scope.addCssValueHandler = function(parser, merger, cssValue) {
    propertiesAcceptingCssValue(cssValue).forEach(function(property) {
      propertyHandlers[property] = propertyHandlers[property] || [];
      propertyHandlers[property].push([parser, merger]);
    });
  };

  function propertyInterpolation(property, left, right) {
    var handlers = left == right ? [] : propertyHandlers[property];
    for (var i = 0; handlers && i < handlers.length; i++) {
      var parsedLeft = handlers[i][0](left);
      var parsedRight = handlers[i][0](right);
      if (parsedLeft !== undefined && parsedRight !== undefined) {
        var interpolationArgs = handlers[i][1](parsedLeft, parsedRight);
        if (interpolationArgs)
          return scope.Interpolation.apply(null, interpolationArgs);
      }
    }
    return scope.Interpolation(false, true, function(bool) {
      return bool ? right : left;
    });
  }
  scope.propertyInterpolation = propertyInterpolation;

})(webAnimationsMinifill, webAnimationsTesting);

