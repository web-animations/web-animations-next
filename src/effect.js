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

(function(shared, scope, testing) {

  scope.convertEffectInput = function(effectInput) {
    var keyframeEffect = shared.normalizeKeyframes(effectInput);
    var propertySpecificKeyframeGroups = makePropertySpecificKeyframeGroups(keyframeEffect);
    var interpolations = makeInterpolations(propertySpecificKeyframeGroups);
    return function(target, fraction) {
      if (fraction != null) {
        // FIXME: Renee, this is where we are removing fractions
        for (var i = 0; i < interpolations.length && interpolations[i].startTime <= fraction; i++)
          if (interpolations[i].endTime >= fraction && interpolations[i].endTime != interpolations[i].startTime) {
            var offsetFraction = fraction - interpolations[i].startTime;
            var localDuration = interpolations[i].endTime - interpolations[i].startTime;
            var scaledLocalTime = interpolations[i].easing(offsetFraction / localDuration);
            scope.apply(target, interpolations[i].property, interpolations[i].interpolation(scaledLocalTime));
          }
      } else {
        for (var property in propertySpecificKeyframeGroups)
          if (property != 'offset' && property != 'easing' && property != 'composite')
            scope.clear(target, property);
      }
    };
  };


  function makePropertySpecificKeyframeGroups(keyframeEffect) {
    var propertySpecificKeyframeGroups = {};

    for (var i = 0; i < keyframeEffect.length; i++) {
      for (var member in keyframeEffect[i]) {
        if (member != 'offset' && member != 'easing' && member != 'composite') {
          var propertySpecificKeyframe = {
            offset: keyframeEffect[i].offset,
            easing: keyframeEffect[i].easing,
            value: keyframeEffect[i][member]
          };
          propertySpecificKeyframeGroups[member] = propertySpecificKeyframeGroups[member] || [];
          propertySpecificKeyframeGroups[member].push(propertySpecificKeyframe);
        }
      }
    }

    for (var groupName in propertySpecificKeyframeGroups) {
      var group = propertySpecificKeyframeGroups[groupName];
      if (group[0].offset != 0 || group[group.length - 1].offset != 1) {
        throw {
          type: DOMException.NOT_SUPPORTED_ERR,
          name: 'NotSupportedError',
          message: 'Partial keyframes are not supported'
        };
      }
    }
    return propertySpecificKeyframeGroups;
  }


  function makeInterpolations(propertySpecificKeyframeGroups) {
    var interpolations = [];
    for (var groupName in propertySpecificKeyframeGroups) {
      var group = propertySpecificKeyframeGroups[groupName];
      for (var i = 0; i < group.length - 1; i++) {
        interpolations.push({
          startTime: group[i].offset,
          endTime: group[i + 1].offset,
          easing: group[i].easing,
          property: groupName,
          interpolation: scope.propertyInterpolation(groupName, group[i].value, group[i + 1].value)
        });
      }
    }
    interpolations.sort(function(leftInterpolation, rightInterpolation) {
      return leftInterpolation.startTime - rightInterpolation.startTime;
    });
    return interpolations;
  }


  if (WEB_ANIMATIONS_TESTING) {
    testing.makePropertySpecificKeyframeGroups = makePropertySpecificKeyframeGroups;
    testing.makeInterpolations = makeInterpolations;
  }

})(webAnimationsShared, webAnimationsMinifill, webAnimationsTesting);
