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

  var element = document.createElement('div');
  var originalInternalAnimate = shared.internalAnimate;

  shared.internalAnimate = function(target, effect, timing) {
    var player;
    if (typeof effect == 'function') {
      player = new scope.Player(originalInternalAnimate(element, [], timing));
      bind(player, target, effect, timing);
    } else {
      player = new scope.Player(originalInternalAnimate(target, effect, timing));
    }
    // FIXME: See if we can just use the maxifill player source and remove this all together.
    window.document.timeline._addPlayer(player);
    return player;
  };

  var sequenceNumber = 0;
  function bind(player, target, effect, timing) {
    var last = undefined;
    timing = shared.normalizeTimingInput(timing);
    var callback = function() {
      var t = callback._player ? callback._player.currentTime : null;
      if (t !== null) {
        t = shared.calculateTimeFraction(shared.calculateActiveDuration(timing), t, timing);
        if (isNaN(t))
          t = null;
      }
      // FIXME: There are actually more conditions under which the effect
      // should be called.
      if (t !== last)
        effect(t, target, player.source);
      last = t;
    };

    callback._player = player;
    callback._registered = false;
    callback._sequenceNumber = sequenceNumber++;
    player._callback = callback;
    register(callback);
  }

  var callbacks = [];
  var ticking = false;
  function register(callback) {
    if (callback._registered)
      return;
    callback._registered = true;
    callbacks.push(callback);
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(tick);
    }
  }

  function tick(t) {
    var updating = callbacks;
    callbacks = [];
    updating.sort(function(left, right) {
      return left._sequenceNumber - right._sequenceNumber;
    });
    updating.filter(function(callback) {
      callback();
      if (!callback._player || callback._player.finished || callback._player.paused)
        callback._registered = false;
      return callback._registered;
    });
    callbacks.push.apply(callbacks, updating);

    if (callbacks.length) {
      ticking = true;
      requestAnimationFrame(tick);
    } else {
      ticking = false;
    }
  }

  scope.Player.prototype._register = function() {
    if (this._callback)
      register(this._callback);
  };

})(webAnimationsShared, webAnimationsMaxifill, webAnimationsTesting);
