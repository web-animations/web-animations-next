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

  var superclass = shared.PlayerProto;

  scope.Player = function(source) {
    this._startOffset = 0;
    this.init();
    this.source = source;
  };

  scope.Player.prototype = {
    init: function() {
      superclass.init.call(this);
      this.childPlayers = [];
    },
    set currentTime(newTime) {
      for (var i = 0; i < this.childPlayers.length; i++)
        this.childPlayers[i].currentTime = newTime;
    },
    get currentTime() {
      return (document.timeline.currentTime - this.startTime) / this.playbackRate;
    },
    get totalDuration() {
      var total = 0;
      if (this.source instanceof global.AnimationSequence) {
        for (var child in this.childPlayers)
          total += this.childPlayers[child].totalDuration;
        return total;
      }
      for (var child in this.childPlayers)
        total = Math.max(total, this.childPlayers[child].totalDuration);
      return total;
    },
    set startTime(newTime) {
      for (var i = 0; i < this.childPlayers.length; i++)
        this.childPlayers[i].startTime = newTime;
    },
    set _startTime(newTime) {
      for (var i = 0; i < this.childPlayers.length; i++)
        this.childPlayers[i]._startTime = newTime + this.childPlayers[i]._startOffset / this.playbackRate;
    },
    activeChild: function() {
      for (var i = 0; i < this.childPlayers.length; i++) {
        if (!this.childPlayers[i].finished) {
          return this.childPlayers[i];
        }
      }
      return this.childPlayers[0];
    },
    get startTime() {
      var active = this.activeChild();
      return active.startTime - active._startOffset;
    },
    pause: function() {
      // make sure currentTime is up-to-date first
      this.currentTime;
      superclass.pause.call(this);
      for (var i = 0; i < this.childPlayers.length; i++)
        this.childPlayers[i].pause();
    },
    play: function() {
      this.paused = false;
      if (this.finished)
        this.__currentTime = this._playbackRate > 0 ? 0 : this.totalDuration;
      this._finishedFlag = false;
      for (var i = 0; i < this.childPlayers.length; i++) {
        if (!this.childPlayers[i].finished)
          this.childPlayers[i].play();
        else {
          this.childPlayers[i].play();
          this.childPlayers[i].finish();
        }
      }
      if (this.childPlayers.length > 0)
        this._startTime = this.childPlayers[0].startTime;
      else
        this._startTime = null;
    },
    reverse: function() {
      var oldStart = this.startTime;
      var oldCurrent = this.currentTime;
      this._playbackRate *= -1;
      this._finishedFlag = false;
      for (var i = 0; i < this.childPlayers.length; i++)
        this.childPlayers[i].reverse();
      //this.setChildOffsets();
      //this.currentTime = oldCurrent;
      this._startTime = oldCurrent * 2 - oldStart;
    },
    setChildOffsets: function() {
      if (this.playbackRate >= 0) {
        if (this.source instanceof global.AnimationSequence) {
          if (this.childPlayers.length > 0)
            this.childPlayers[0]._startOffset = 0;
          for (var i = 1; i < this.childPlayers.length; i++)
            this.childPlayers[i]._startOffset = (this.childPlayers[i - 1]._startOffset + this.childPlayers[i - 1].totalDuration);
        }
      } else {
        if (this.source instanceof global.AnimationSequence) {
          if (this.childPlayers.length > 0)
            this.childPlayers[this.childPlayers.length - 1]._startOffset = 0;
          for (var i = this.childPlayers.length - 2; i >= 0; i--)
            this.childPlayers[i]._startOffset = this.childPlayers[i + 1]._startOffset + this.childPlayers[i + 1].totalDuration;
        } else {
          for (var i = this.childPlayers.length - 1; i >= 0; i--)
            this.childPlayers[i]._startOffset = this.totalDuration - this.childPlayers[i].totalDuration;
        }
      }
    },
    __proto__: shared.PlayerProto,
  };
})(shared, maxifill, testing);
