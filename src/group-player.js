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

(function(scope, testing) {

  // These methods get transplanted into players if their souce is a group using the absorbMethods method on the global.Player.prototype.
  // FIXME: I realise that this is a confusing way to do this. Alternatively we can move _most_ of these into the global.Player.prototype
  // and have them check for this.hasOwnProperty('childPlayers') or move _all_ of them into the player proto and have them check for
  // this.source insanceof ...
  // I don't know what's best. Personally I kind of like this approach because it keeps the groups logic out of the player proto.
  maxifill.groupPlayer = {
    setCurrentTime: function(newTime) {
      if (!this.paused)
        this.startTime += (this.currentTime - newTime) / this.playbackRate;
      else
        if (this.hasOwnProperty('childPlayers'))
          for (var i = 0; i < this.childPlayers.length; i++)
            this.childPlayers[i].currentTime = newTime;
      this._currentTime = newTime - this.offset;
    },
    getTotalDuration: function() {
      if (this.source instanceof global.AnimationSequence) {
        var total = 0;
        for(var child in this.childPlayers)
          total += this.childPlayers[child].totalDuration;
        return total;
      }
      var total = 0;
      for(var child in this.childPlayers)
        total = Math.max(total, this.childPlayers[child].totalDuration);
      return total;
    },
    // isFinished: function() {
    //   return this._playbackRate > 0 && this.__currentTime >= this.totalDuration ||
    //          this._playbackRate < 0 && this.__currentTime <= 0;
    // },
    setStartTime: function(newTime) {
      if(!this.paused) {
        this._startTime = newTime + this.offset;
        if (this.hasOwnProperty('childPlayers'))
          for (var i = 0; i < this.childPlayers.length; i++)
            this.childPlayers[i].startTime = newTime;
      }
    },
    pausePlayer: function() {
      this.paused = true;
      this._startTime = null;
      if (this.hasOwnProperty('childPlayers'))
        for (var i = 0; i < this.childPlayers.length; i++)
          this.childPlayers[i].pause();
    },
    playPlayer: function() {
      this.paused = false;
      if (this.finished)
        this.__currentTime = this._playbackRate > 0 ? 0 : this.totalDuration;
      this._finishedFlag = false;
      shared.restart();
      if (this.hasOwnProperty('childPlayers'))
        for (var i = 0; i < this.childPlayers.length; i++)
          if (!this.childPlayers[i].finished)
            this.childPlayers[i].play();
      this.startTime = this._timeline.currentTime - this.__currentTime / this._playbackRate;
    },
    // TODO: Fix this. ATM it's just as-is from player proto
    setPlaybackRate: function(newRate) {
      var previousTime = this.currentTime;
      this._playbackRate = newRate;
      this.currentTime = previousTime;
    },
    reversePlayer: function() {
      this._playbackRate *= -1;
      if (this._finishedFlag)
        this._startTime = this._timeline.currentTime - this.offset - this._timeline.currentTime / this._playbackRate;
      else
        this._startTime = this._timeline.currentTime - this.__currentTime / this._playbackRate;
      shared.restart();
      if (!this._inTimeline) {
        this._inTimeline = true;
        document.timeline.players.push(this);
      }
      this._finishedFlag = false;
      if (this.hasOwnProperty('childPlayers'))
        for (var i = 0; i < this.childPlayers.length; i++)
          this.childPlayers[i].reverse();
    },
  };

})(maxifill, testing);
