
suite('child-player-pause-after-finish-bug', function() {
  setup(function() {
    document.timeline._players = [];
    this.elements = [];
    var animationMargin = function(target) {
      return new Animation(
        target,
        [
         {marginLeft: '0px'},
         {marginLeft: '100px'}
        ],
        500);
    };
    var animationColor = function(target) {
      return new Animation(
        target,
        [
         {backgroundColor: 'black'},
         {backgroundColor: 'white'}
        ],
        500);
    };
    var sequenceWithEffects = function(target) {
      return new AnimationSequence(
        [
         animationMargin(target),
         animationColor(target)
        ]);
    };
    var seqSimple_target = document.createElement('div');
    this.elements.push(seqSimple_target);
    var seqSimple_source = sequenceWithEffects(seqSimple_target);

    var animSimple_target = document.createElement('div');
    this.elements.push(animSimple_target);
    var animSimple_source = animationColor(animSimple_target);

    this.animSimple_source = animSimple_source;
    this.seqSimple_source = seqSimple_source;
  });

  teardown(function() {
    for (var i = 0; i < this.elements.length; i++) {
      if (this.elements[i].parent)
        this.elements[i].parent.removeChild(this.elements[i]);
    }
  });

  function checkTimes(player, playerState, innerPlayerStates, description) {
    description = description ? (description + ' ') : '';
    _checkTimes(player, playerState, 0, description + 'top player');
    _checkTimes(player, innerPlayerStates, 0, description + 'inner player');
  }

  function _checkTimes(player, timingList, index, trace) {
    assert.isDefined(player, trace + ' exists');
    if (timingList.length == 0) {
      assert.equal(player._childPlayers.length, index, trace + ' no remaining players');
      return;
    }
    if (typeof timingList[0] == 'number') {
      if (isNaN(timingList[0]))
        assert.ok(isNaN(player.startTime), trace + 'expected NaN startTime');
      else
        assert.equal(player.startTime, timingList[0], trace + ' startTime');
      assert.equal(player.currentTime, timingList[1], trace + ' currentTime');
    } else {
      _checkTimes(player._childPlayers[index], timingList[0], 0, trace + ' ' + index);
      _checkTimes(player, timingList.slice(1), index + 1, trace);
    }
  }

  test('Simple AnimationSequence', function() {
    var player = document.timeline.play(this.seqSimple_source);
    tick(0);
    checkTimes(player, [0, 0], [[0, 0], [500, -500]], 't = 0');

    // Tick so that 0 is finished and 1 is started.
    tick(700);
    checkTimes(player, [0, 700], [[0, 500], [500, 200]], 't = 700');

    // Pause, and tick a small amount.
    player.pause();
    tick(710);
    checkTimes(player, [NaN, 700], [[NaN, 500], [NaN, 200]], 't = 710');

    // Play and tick a small amount (this should do nothing to the currentTime).
    player.play();
    tick(720);
    checkTimes(player, [20, 700], [[20, 500], [520, 200]], 't = 720');

    // Tick so that the while group is finished.
    tick(1320);
    checkTimes(player, [20, 1000], [[20, 500], [520, 500]], 't = 1320');
  });

  test('AnimationSequence wrapped in an AnimationGroup', function() {
    var player = document.timeline.play(new AnimationGroup([this.seqSimple_source]));
    tick(0);
    checkTimes(player, [0, 0], [[[0, 0], [500, -500]]], 't = 0');

    // Tick so that 0 is finished and 1 is started.
    tick(700);
    checkTimes(player, [0, 700], [[[0, 500], [500, 200]]], 't = 700');

    // Pause, and tick a small amount.
    player.pause();
    tick(710);
    checkTimes(player, [NaN, 700], [[[NaN, 500], [NaN, 200]]], 't = 710');

    // Play and tick a small amount (this should do nothing to the currentTime).
    player.play();
    tick(720);
    checkTimes(player, [20, 700], [[[20, 500], [520, 200]]], 't = 720');

    // Tick so that the while group is finished.
    tick(1320);
    checkTimes(player, [20, 1000], [[[20, 500], [520, 500]]], 't = 1320');
  });

  test('AnimationSequence wrapped in an AnimationSequence', function() {
    var player = document.timeline.play(new AnimationSequence([this.seqSimple_source]));
    tick(0);
    checkTimes(player, [0, 0], [[[0, 0], [500, -500]]], 't = 0');

    // Tick so that 0 is finished and 1 is started.
    tick(700);
    checkTimes(player, [0, 700], [[[0, 500], [500, 200]]], 't = 700');

    // Pause, and tick a small amount.
    player.pause();
    tick(710);
    checkTimes(player, [NaN, 700], [[[NaN, 500], [NaN, 200]]], 't = 710');

    // Play and tick a small amount (this should do nothing to the currentTime).
    player.play();
    tick(720);
    checkTimes(player, [20, 700], [[[20, 500], [520, 200]]], 't = 720');

    // Tick so that the while group is finished.
    tick(1320);
    checkTimes(player, [20, 1000], [[[20, 500], [520, 500]]], 't = 1320');
  });

  test('AnimationSequence which is the first child in an AnimationSequence', function() {
    var player = document.timeline.play(new AnimationSequence([this.seqSimple_source, this.animSimple_source]));
    tick(0);
    checkTimes(player, [0, 0], [[[0, 0], [500, -500]], [1000, -1000]], 't = 0');

    // Tick so that seq is finished, and last child is started.
    tick(1200);
    checkTimes(player, [0, 1200], [[[0, 500], [500, 500]], [1000, 200]], 't = 1200');

    // Pause, and tick a small amount.
    player.pause();
    tick(1300);
    checkTimes(player, [NaN, 1200], [[[NaN, 500], [NaN, 500]], [NaN, 200]], 't = 1300');

    // Play and tick a small amount (this should do nothing to the currentTime).
    player.play();
    tick(1400);
    checkTimes(player, [200, 1200], [[[200, 500], [700, 500]], [1200, 200]], 't = 1400');

    // Tick so that the while group is finished.
    tick(1800);
    checkTimes(player, [200, 1500], [[[200, 500], [700, 500]], [1200, 500]], 't = 1800');
  });


  test('AnimationGroup wrapped in an AnimationGroup', function() {
    var target = document.createElement('div');
    var player = document.timeline.play(
      new AnimationGroup(
        [
        new AnimationGroup(
          [
          new Animation(
            target,
            [
            {backgroundColor: 'blue'},
            {backgroundColor: 'red'}
            ],
            500
            ),
          new Animation(
            target,
            [
            {backgroundColor: 'blue'},
            {backgroundColor: 'red'}
            ],
            1000
            ),
          ])
        ]));
    tick(0);
    checkTimes(player, [0, 0], [[[0, 0], [0, 0]]], 't = 0');

    // Tick so that 0 is finished and 1 is started.
    tick(700);
    checkTimes(player, [0, 700], [[[0, 500], [0, 700]]], 't = 700');

    // Pause, and tick a small amount.
    player.pause();
    tick(710);
    checkTimes(player, [NaN, 700], [[[NaN, 500], [NaN, 700]]], 't = 710');

    // Play and tick a small amount (this should do nothing to the currentTime).
    player.play();
    tick(720);
    checkTimes(player, [20, 700], [[[20, 500], [20, 700]]], 't = 720');

    // Tick so that the while group is finished.
    tick(1320);
    checkTimes(player, [20, 1000], [[[20, 500], [20, 1000]]], 't = 1320');
  });
});
