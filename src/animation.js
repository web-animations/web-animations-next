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

  shared.sequenceNumber = 0;

  var AnimationEvent = function(target, currentTime, timelineTime) {
    this.target = target;
    this.currentTime = currentTime;
    this.timelineTime = timelineTime;

    this.type = 'finish';
    this.bubbles = false;
    this.cancelable = false;
    this.currentTarget = target;
    this.defaultPrevented = false;
    this.eventPhase = Event.AT_TARGET;
    this.timeStamp = Date.now();
  };

  scope.Animation = function(effect) {
    this._sequenceNumber = shared.sequenceNumber++;
    this._currentTime = 0;
    this._startTime = null;
    this._paused = false;
    this._playbackRate = 1;
    this._inTimeline = true;
    this._finishedFlag = false;
    this.onfinish = null;
    this._finishHandlers = [];
    this._effect = effect;
    this._inEffect = this._effect._update(0);
    this._idle = true;
    this._currentTimePending = false;
    this._readyPromise;
    this._finishedPromise;
  };

  scope.Animation.prototype = {
    _playStateUpdate: function(oldPlayState) {
      var newPlayState = this.playState;
      // console.log(oldPlayState, newPlayState, this.currentTime, this.startTime);
      if (this._readyPromise && newPlayState !== oldPlayState) {
        // console.log(oldPlayState, newPlayState, this.currentTime);
        if (newPlayState == 'idle') {
          if (this._readyPromiseState == 'pending') {
            // FIXME: Should this raise some kind of error?
            this._rejectReadyPromise();
          }
          this._resetReadyPromise();
          this._resolveReadyPromise();
        } else if (oldPlayState == 'pending') {
          this._resolveReadyPromise();
        } else if (newPlayState == 'pending') {
          this._resetReadyPromise();
        }
      }
      if (this._finishedPromise && newPlayState !== oldPlayState) {
        // console.log(oldPlayState, newPlayState, this.currentTime);
        if (newPlayState == 'idle') {
          if (this._finishedPromiseState == 'pending') {
            this._rejectFinishedPromise();
          }
          this._resetFinishedPromise();
        } else if (newPlayState == 'finished') {
          this._resolveFinishedPromise();
        } else if (oldPlayState == 'finished') {
          this._resetFinishedPromise();
        }
      }
    },
    _ensureAlive: function() {
      // If an animation is playing backwards and is not fill backwards/both
      // then it should go out of effect when it reaches the start of its
      // active interval (currentTime == 0).
      if (this.playbackRate < 0 && this.currentTime === 0) {
        this._inEffect = this._effect._update(-1);
      } else {
        this._inEffect = this._effect._update(this.currentTime);
      }
      if (!this._inTimeline && (this._inEffect || !this._finishedFlag)) {
        this._inTimeline = true;
        scope.timeline._animations.push(this);
      }
    },
    _tickCurrentTime: function(newTime, ignoreLimit) {
      var oldPlayState = this.playState;
      if (newTime != this._currentTime) {
        this._currentTime = newTime;
        if (this._isFinished && !ignoreLimit)
          this._currentTime = this._playbackRate > 0 ? this._totalDuration : 0;
        this._ensureAlive();
      }
      this._playStateUpdate(oldPlayState);
    },
    get currentTime() {
      if (this._idle || this._currentTimePending)
        return null;
      return this._currentTime;
    },
    set currentTime(newTime) {
      var oldPlayState = this.playState;
      newTime = +newTime;
      if (isNaN(newTime))
        return;
      scope.restart();
      if (!this._paused && this._startTime != null) {
        this._startTime = this._timeline.currentTime - newTime / this._playbackRate;
      }
      this._currentTimePending = false;
      if (this._currentTime == newTime)
        return;
      this._tickCurrentTime(newTime, true);
      scope.invalidateEffects();
      this._playStateUpdate(oldPlayState);
    },
    get startTime() {
      return this._startTime;
    },
    set startTime(newTime) {
      var oldPlayState = this.playState;
      newTime = +newTime;
      if (isNaN(newTime))
        return;
      if (this._paused || this._idle)
        return;
      this._startTime = newTime;
      this._tickCurrentTime((this._timeline.currentTime - this._startTime) * this.playbackRate);
      scope.invalidateEffects();
      this._playStateUpdate(oldPlayState);
    },
    get playbackRate() {
      return this._playbackRate;
    },
    set playbackRate(value) {
      if (value == this._playbackRate) {
        return;
      }
      var oldCurrentTime = this.currentTime;
      this._playbackRate = value;
      this._startTime = null;
      if (this.playState != 'paused' && this.playState != 'idle') {
        this.play();
      }
      if (oldCurrentTime != null) {
        this.currentTime = oldCurrentTime;
      }
    },
    get _isFinished() {
      return !this._idle && (this._playbackRate > 0 && this._currentTime >= this._totalDuration ||
          this._playbackRate < 0 && this._currentTime <= 0);
    },
    get _totalDuration() { return this._effect._totalDuration; },
    get playState() {
      if (this._idle)
        return 'idle';
      if ((this._startTime == null && !this._paused && this.playbackRate != 0) || this._currentTimePending)
        return 'pending';
      if (this._paused)
        return 'paused';
      if (this._isFinished)
        return 'finished';
      return 'running';
    },
    _resetFinishedPromise: function() {
      this._finishedPromise = new Promise(
          function(resolve, reject) {
            this._finishedPromiseState = 'pending';

            this._resolveFinishedPromise = function() {
              this._finishedPromiseState = 'resolved';
              resolve();
            }

            this._rejectFinishedPromise = function() {
              this._finishedPromiseState = 'rejected';
              reject();
            }
          }.bind(this));
    },
    get finished() {
      if (!this._finishedPromise) {
        this._resetFinishedPromise();
        if (this.playState == 'finished') {
          this._resolveFinishedPromise();
        }
      }
      return this._finishedPromise;
    },
    _resetReadyPromise: function() {
      this._readyPromise = new Promise(
          function(resolve, reject) {
            this._readyPromiseState = 'pending';

            this._resolveReadyPromise = function() {
              this._readyPromiseState = 'resolved';
              resolve();
            };

            this._rejectReadyPromise = function() {
              this._readyPromiseState = 'rejected';
              reject();
            }
          }.bind(this));
    },
    get ready() {
      if (!this._readyPromise) {
        this._resetReadyPromise();
        if (this.playState !== 'pending') {
          this._resolveReadyPromise();
          console.log(this._readyPromise, this._readyPromiseState);
        }
      }
      return this._readyPromise;
    },
    play: function() {
      var oldPlayState = this.playState;
      this._paused = false;
      if (this._isFinished || this._idle) {
        this._currentTime = this._playbackRate > 0 ? 0 : this._totalDuration;
        this._startTime = null;
        scope.invalidateEffects();
      }
      this._finishedFlag = false;
      scope.restart();
      this._idle = false;
      this._ensureAlive();
      this._playStateUpdate(oldPlayState);
    },
    pause: function() {
      if (!this._isFinished && !this._paused && !this._idle) {
        this._currentTimePending = true;
      }
      this._startTime = null;
      this._paused = true;
    },
    finish: function() {
      if (this._idle)
        return;
      this.currentTime = this._playbackRate > 0 ? this._totalDuration : 0;
      this._startTime = this._totalDuration - this.currentTime;
      this._currentTimePending = false;
    },
    cancel: function() {
      this._inEffect = false;
      this._idle = true;
      this.currentTime = 0;
      this._startTime = null;
    },
    reverse: function() {
      this.playbackRate *= -1;
      this.play();
    },
    addEventListener: function(type, handler) {
      if (typeof handler == 'function' && type == 'finish')
        this._finishHandlers.push(handler);
    },
    removeEventListener: function(type, handler) {
      if (type != 'finish')
        return;
      var index = this._finishHandlers.indexOf(handler);
      if (index >= 0)
        this._finishHandlers.splice(index, 1);
    },
    _fireEvents: function(baseTime) {
      var finished = this._isFinished;
      if ((finished || this._idle) && !this._finishedFlag) {
        var event = new AnimationEvent(this, this._currentTime, baseTime);
        var handlers = this._finishHandlers.concat(this.onfinish ? [this.onfinish] : []);
        setTimeout(function() {
          handlers.forEach(function(handler) {
            handler.call(event.target, event);
          });
        }, 0);
      }
      this._finishedFlag = finished;
    },
    _tick: function(timelineTime) {
      var oldPlayState = this.playState;
      if (!this._idle && !this._paused) {
        if (this._startTime == null)
          this.startTime = timelineTime - this._currentTime / this.playbackRate;
        else if (!this._isFinished)
          this._tickCurrentTime((timelineTime - this._startTime) * this.playbackRate);
      }

      this._currentTimePending = false;
      this._fireEvents(timelineTime);
      return !this._idle && (this._inEffect || !this._finishedFlag);
      this._playStateUpdate();
    },
  };

  if (WEB_ANIMATIONS_TESTING) {
    testing.webAnimations1Animation = scope.Animation;
  }

})(webAnimationsShared, webAnimations1, webAnimationsTesting);
