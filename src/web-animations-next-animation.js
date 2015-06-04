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
  scope.Animation = function(effect) {
    this.effect = effect;
    if (effect) {
      // FIXME: detach existing animation.
      effect._animation = this;
    }
    this._sequenceNumber = shared.sequenceNumber++;
    this._holdTime = 0;
    this._paused = false;
    this._isGroup = false;
    this._animation = null;
    this._childAnimations = [];
    this._callback = null;
    this._rebuildUnderlyingAnimation();
    // Animations are constructed in the idle state.
    this._animation.cancel();
    this._readyPromise;
    this._finishedPromise;
    this._oldPlayState = 'idle';
    this._updateOldPlayState();
    this.name = 'OUTER';
    // TODO: initialize ready and finished promises?
    // this._resetReadyPromise();
    // this._resolveReadyPromise();
  };

  // TODO: add an effect getter/setter
  scope.Animation.prototype = {
    _updateOldPlayState: function() {
      // Might want to do something like (if we have already called
      // updateOldPlayState since the last promise update, do a promise update
      // first)
      if (this._oldPlayState !== this.playState) {
        if (this._readyPromise)
          console.log(this._oldPlayState, this.playState, this._updateOldPlayState.caller);
        this._oldPlayState = this.playState;
      }
    },
    _updatePromises: function() {
      var oldPlayState = this._oldPlayState;
      var newPlayState = this.playState;
      // if (this._readyPromise || this._finishedPromise)
      // console.log(this._sequenceNumber, oldPlayState, newPlayState);
      if (this._readyPromise && newPlayState !== oldPlayState) {
        console.log('UPDATE READY', oldPlayState, newPlayState, this._updatePromises.caller);
        if (newPlayState == 'idle') {
          // If the animation play state changes from not-idle to idle before
          // the current ready promise resolves, reject the current ready
          // promise.
          if (this._readyPromiseState == 'pending') {
            this._rejectReadyPromise();
          }
          // Make the current ready promise a new, resolved promise.
          this._resetReadyPromise();
          this._resolveReadyPromise();
        } else if (oldPlayState == 'pending') {
          this._resolveReadyPromise();
        } else if (newPlayState == 'pending') {
          this._resetReadyPromise();
        }
      }
      if (this._finishedPromise && newPlayState !== oldPlayState) {
        console.log('UPDATE FINISHED', oldPlayState, newPlayState, this._updatePromises.caller);
        if (newPlayState == 'idle') {
          // If the animation play state changes from not-idle to idle before
          // the current finished promise resolves, reject the current
          // finished promise.
          if (this._finishedPromiseState == 'pending') {
            this._rejectFinishedPromise();
          }
          // Make the current finished promise a new, pending promise.
          this._resetFinishedPromise();
        } else if (newPlayState == 'finished') {
          this._resolveFinishedPromise();
        } else if (oldPlayState == 'finished') {
          this._resetFinishedPromise();
        }
      }
      this._updateOldPlayState();
    },
    _rebuildUnderlyingAnimation: function() {
      this._updateOldPlayState();
      var oldPlaybackRate;
      var oldPaused;
      var oldStartTime;
      var oldCurrentTime;
      var hadUnderlying = this._animation ? true : false;
      if (hadUnderlying) {
        oldPlaybackRate = this.playbackRate;
        oldPaused = this._paused;
        oldStartTime = this.startTime;
        oldCurrentTime = this.currentTime;
        this._animation.cancel();
        this._animation._wrapper = null;
        this._animation = null;
      }

      if (!this.effect || this.effect instanceof window.KeyframeEffect) {
        this._animation = scope.newUnderlyingAnimationForKeyframeEffect(this.effect);
        scope.bindAnimationForKeyframeEffect(this);
      }
      if (this.effect instanceof window.SequenceEffect || this.effect instanceof window.GroupEffect) {
        this._animation = scope.newUnderlyingAnimationForGroup(this.effect);
        scope.bindAnimationForGroup(this);
      }
      if (hadUnderlying) {
        if (oldPlaybackRate != 1) {
          this.playbackRate = oldPlaybackRate;
        }
        if (oldStartTime !== null) {
          this.startTime = oldStartTime;
        } else if (oldCurrentTime !== null) {
          this.currentTime = oldCurrentTime;
        } else if (this._holdTime !== null) {
          this.currentTime = this._holdTime;
        }
        if (oldPaused) {
          this.pause();
        }
      }
      // FIXME: Not sure if we should do this here, as this whole method is
      // just an implementation tool.
      this._updatePromises();
    },
    _updateChildren: function() {
      if (!this.effect || this.playState == 'idle')
        return;

      var offset = this.effect._timing.delay;
      this._childAnimations.forEach(function(childAnimation) {
        this._arrangeChildren(childAnimation, offset);
        if (this.effect instanceof window.SequenceEffect)
          offset += scope.groupChildDuration(childAnimation.effect);
      }.bind(this));
    },
    _setExternalAnimation: function(animation) {
      if (!this.effect || !this._isGroup)
        return;
      for (var i = 0; i < this.effect.children.length; i++) {
        this.effect.children[i]._animation = animation;
        this._childAnimations[i]._setExternalAnimation(animation);
      }
    },
    _constructChildAnimations: function() {
      if (!this.effect || !this._isGroup)
        return;
      var offset = this.effect._timing.delay;
      this._removeChildAnimations();
      this.effect.children.forEach(function(child) {
        var childAnimation = window.document.timeline._play(child);
        this._childAnimations.push(childAnimation);
        childAnimation.playbackRate = this.playbackRate;
        if (this._paused)
          childAnimation.pause();
        child._animation = this.effect._animation;

        this._arrangeChildren(childAnimation, offset);

        if (this.effect instanceof window.SequenceEffect)
          offset += scope.groupChildDuration(child);
      }.bind(this));
    },
    _arrangeChildren: function(childAnimation, offset) {
      if (this.startTime === null) {
        childAnimation.currentTime = this.currentTime - offset / this.playbackRate;
      } else if (childAnimation.startTime !== this.startTime + offset / this.playbackRate) {
        childAnimation.startTime = this.startTime + offset / this.playbackRate;
      }
    },
    get playState() {
      // Can change back to `return this._animation.playState` if we decide
      // not to check promises in rebildUnderlyingAnimation.
      return this._animation ? this._animation.playState : 'idle';
    },
    _resetFinishedPromise: function() {
      this._finishedPromise = new Promise(
          function(resolve, reject) {
            this._finishedPromiseState = 'pending';
            this._resolveFinishedPromise = function() {
              this._finishedPromiseState = 'resolved';
              resolve(this);
            };
            this._rejectFinishedPromise = function() {
              this._finishedPromiseState = 'rejected';
              reject({type: DOMException.ABORT_ERR, name: 'AbortError'});
            };
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
              resolve(this);
            };
            this._rejectReadyPromise = function() {
              this._readyPromiseState = 'rejected';
              reject({type: DOMException.ABORT_ERR, name: 'AbortError'});
            };
          }.bind(this));
    },
    get ready() {
      if (!this._readyPromise) {
        this._resetReadyPromise();
        if (this.playState !== 'pending') {
          this._resolveReadyPromise();
        }
      }
      return this._readyPromise;
    },
    get onfinish() {
      return this._onfinish;
    },
    set onfinish(v) {
      if (typeof v == 'function') {
        this._onfinish = v;
        this._animation.onfinish = (function(e) {
          e.target = this;
          v.call(this, e);
        }).bind(this);
      } else {
        this._animation.onfinish = v;
        this.onfinish = this._animation.onfinish;
      }
    },
    get currentTime() {
      this._updateOldPlayState();
      var currentTime = this._animation.currentTime;
      this._updatePromises();
      return currentTime;
    },
    set currentTime(v) {
      this._updateOldPlayState();
      this._animation.currentTime = isFinite(v) ? v : Math.sign(v) * Number.MAX_VALUE;
      this._register();
      this._forEachChild(function(child, offset) {
        child.currentTime = v - offset;
      });
      this._updatePromises();
    },
    get startTime() {
      return this._animation.startTime;
    },
    set startTime(v) {
      this._updateOldPlayState();
      this._animation.startTime = isFinite(v) ? v : Math.sign(v) * Number.MAX_VALUE;
      this._register();
      this._forEachChild(function(child, offset) {
        child.startTime = v + offset;
      });
      this._updatePromises();
    },
    get playbackRate() {
      return this._animation.playbackRate;
    },
    set playbackRate(value) {
      this._updateOldPlayState();
      var oldCurrentTime = this.currentTime;
      this._animation.playbackRate = value;
      this._forEachChild(function(childAnimation) {
        childAnimation.playbackRate = value;
      });
      if (this.playState != 'paused' && this.playState != 'idle') {
        this.play();
      }
      // FIXME: This is should set holdTime and set currentTime on next tick.
      if (oldCurrentTime !== null) {
        this.currentTime = oldCurrentTime;
      }
      this._updatePromises();
    },
    get source() {
      shared.deprecated('Animation.source', '2015-03-23', 'Use Animation.effect instead.');
      return this.effect;
    },
    play: function() {
      this._updateOldPlayState();
      this._paused = false;
      this._animation.play();
      if (document.timeline._animations.indexOf(this) == -1) {
        document.timeline._animations.push(this);
      }
      this._register();
      scope.awaitStartTime(this);
      this._forEachChild(function(child) {
        var time = child.currentTime;
        child.play();
        child.currentTime = time;
      });
      this._updatePromises();
    },
    pause: function() {
      this._updateOldPlayState();
      if (this.currentTime) {
        this._holdTime = this.currentTime;
      }
      this._animation.pause();
      this._register();
      this._forEachChild(function(child) {
        child.pause();
      });
      this._paused = true;
      this._updatePromises();
    },
    finish: function() {
      this._updateOldPlayState();
      this._animation.finish();
      this._register();
      // TODO: child animations??
      this._updatePromises();
    },
    cancel: function() {
      this._updateOldPlayState();
      this._animation.cancel();
      this._register();
      this._removeChildAnimations();
      this._updatePromises();
    },
    reverse: function() {
      this._updateOldPlayState();
      var oldCurrentTime = this.currentTime;
      this._animation.reverse();
      this._forEachChild(function(childAnimation) {
        childAnimation.reverse();
      });
      if (oldCurrentTime !== null) {
        this.currentTime = oldCurrentTime;
      }
      this._updatePromises();
    },
    addEventListener: function(type, handler) {
      var wrapped = handler;
      if (typeof handler == 'function') {
        wrapped = (function(e) {
          e.target = this;
          handler.call(this, e);
        }).bind(this);
        handler._wrapper = wrapped;
      }
      this._animation.addEventListener(type, wrapped);
    },
    removeEventListener: function(type, handler) {
      this._animation.removeEventListener(type, (handler && handler._wrapper) || handler);
    },
    _removeChildAnimations: function() {
      while (this._childAnimations.length)
        this._childAnimations.pop().cancel();
    },
    _forEachChild: function(f) {
      var offset = 0;
      if (this.effect.children && this._childAnimations.length < this.effect.children.length)
        this._constructChildAnimations();
      this._childAnimations.forEach(function(child) {
        f.call(this, child, offset);
        if (this.effect instanceof window.SequenceEffect)
          offset += child.effect.activeDuration;
      }.bind(this));

      if (this.playState == 'pending')
        return;
      var timing = this.effect._timing;
      var t = this.currentTime;
      if (t !== null)
        t = shared.calculateTimeFraction(shared.calculateActiveDuration(timing), t, timing);
      if (t == null || isNaN(t))
        this._removeChildAnimations();
    },
  };

})(webAnimationsShared, webAnimationsNext, webAnimationsTesting);
