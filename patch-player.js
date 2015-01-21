
var nuid = 0;

var oldAnimate = Element.prototype.animate;

Element.prototype.animate = function(kf, t) {
  var p = oldAnimate.bind(this)(kf, t);
  if(this.getAttribute('id')) {
    console.log('var p' + nuid + ' = ' + this.id.replace('-', '') + '.animate(' + JSON.stringify(kf) + ', ' + JSON.stringify(t) + ');');
    p.nuid = nuid++;
    var player = {
      play: function() {
      	console.log('p' + p.nuid + '.play();');
      	p.play();
      },
      pause: function() {
      	console.log('p' + p.nuid + '.pause();');
      	p.pause();
      },
      reverse: function() {
        console.log('p' + p.nuid + '.reverse();');
        p.reverse();
      },
      cancel: function() {
        console.log('p' + p.nuid + '.cancel();');
        p.cancel();
      },
      finish: function() {
        console.log('p' + p.nuid + '.finish();');
        p.finish();
      },
      get currentTime() {
        var ct = p.currentTime;
        console.log('console.log(p' + p.nuid + '.currentTime + " | ' + ct + '");');
        return ct;
      },
      set currentTime(newTime) {
        console.log('p' + p.nuid + '.currentTime = ' + newTime + ';');
        p.currentTime = newTime;
      },
      get playbackRate() {
        var pr = p.playbackRate;
        console.log('console.log(p' + p.nuid + '.playbackRate + " | ' + pr + '");');
        return pr;
      },
      set playbackRate(newRate) {
        console.log('p' + p.nuid + '.playbackRate = ' + newRate + ';');
        p.playbackRate = newRate;
      },
      get startTime() {
        var st = p.startTime;
        console.log('console.log(p' + p.nuid + '.startTime + " | ' + st + '");');
        return st;
      },
      set startTime(newTime) {
        console.log('p' + p.nuid + '.startTime = ' + newTime + ';');
        p.startTime = newTime;
      },
      get playState() {
        var ps = p.playState;
        console.log('console.log(p' + p.nuid + '.playState + " | ' + ps + '");');
        return ps;
      }
    };
    return player;
  }
  return p;
};
