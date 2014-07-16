suite('group-player', function() {
  setup(function() {
    document.timeline._players = [];
    webAnimationsMinifill.timeline._players = [];
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
    var sequenceEmpty = function() {
      return new AnimationSequence();
    };
    var groupEmpty = function() {
      return new AnimationGroup();
    };
    var sequenceWithEffects = function(target) {
      return new AnimationSequence(
          [
           animationMargin(target),
           animationColor(target)
          ]);
    };
    var groupWithEffects = function(target) {
      return new AnimationGroup(
          [
           animationMargin(target),
           animationColor(target)
          ]);
    };

    var animSimple_target = document.createElement('div');
    this.elements.push(animSimple_target);
    var animSimple_source = animationColor(animSimple_target);

    var seqEmpty_source = sequenceEmpty();

    var seqSimple_target = document.createElement('div');
    this.elements.push(seqSimple_target);
    var seqSimple_source = sequenceWithEffects(seqSimple_target);

    var seqWithSeq_target = document.createElement('div');
    this.elements.push(seqWithSeq_target);
    var seqWithSeq_source = new AnimationSequence(
        [
         animationMargin(seqWithSeq_target),
         animationColor(seqWithSeq_target),
         sequenceWithEffects(seqWithSeq_target)
        ]);

    var seqWithGroup_target = document.createElement('div');
    this.elements.push(seqWithGroup_target);
    var seqWithGroup_source = new AnimationSequence(
        [
         animationMargin(seqWithGroup_target),
         animationColor(seqWithGroup_target),
         groupWithEffects(seqWithGroup_target)
        ]);

    var seqWithEmptyGroup_source = new AnimationSequence([groupEmpty()]);
    var seqWithEmptySeq_source = new AnimationSequence([sequenceEmpty()]);

    var groupEmpty_source = groupEmpty();

    var groupSimple_target = document.createElement('div');
    this.elements.push(groupSimple_target);
    var groupSimple_source = groupWithEffects(groupSimple_target);

    var groupWithSeq_target = document.createElement('div');
    this.elements.push(groupWithSeq_target);
    var groupWithSeq_source = new AnimationGroup(
        [
         animationMargin(groupWithSeq_target),
         animationColor(groupWithSeq_target),
         sequenceWithEffects(groupWithSeq_target)
        ]);

    var groupWithGroup_target = document.createElement('div');
    this.elements.push(groupWithGroup_target);
    var groupWithGroup_source = new AnimationGroup(
        [
         animationMargin(groupWithGroup_target),
         animationColor(groupWithGroup_target),
         groupWithEffects(groupWithGroup_target)
        ]);

    var groupWithEmptyGroup_source = new AnimationGroup([groupEmpty()]);
    var groupWithEmptySeq_source = new AnimationGroup([sequenceEmpty()]);

    this.animSimple_source = animSimple_source;

    this.seqEmpty_source = seqEmpty_source;
    this.seqSimple_source = seqSimple_source;
    this.seqWithSeq_source = seqWithSeq_source;
    this.seqWithGroup_source = seqWithGroup_source;
    this.seqWithEmptyGroup_source = seqWithEmptyGroup_source;
    this.seqWithEmptySeq_source = seqWithEmptySeq_source;

    this.groupEmpty_source = groupEmpty_source;
    this.groupSimple_source = groupSimple_source;
    this.groupWithSeq_source = groupWithSeq_source;
    this.groupWithGroup_source = groupWithGroup_source;
    this.groupWithEmptyGroup_source = groupWithEmptyGroup_source;
    this.groupWithEmptySeq_source = groupWithEmptySeq_source;

    this.staticAnimation = function(target, value, duration) {
      var animation = new Animation(target, [{marginLeft: value}, {marginLeft: value}], duration);
      animation.testValue = value;
      return animation;
    };
    // The following animation structure looks like:
    // 44444
    // 11
    //   33
    //   2
    // 0
    this.complexTarget = document.createElement('div');
    this.elements.push(this.complexTarget);
    this.complexSource = new AnimationGroup([
      this.staticAnimation(this.complexTarget, '4px', 5),
      new AnimationSequence([
        this.staticAnimation(this.complexTarget, '1px', 2),
        new AnimationGroup([
          this.staticAnimation(this.complexTarget, '3px', 2),
          this.staticAnimation(this.complexTarget, '2px', 1),
        ]),
      ]),
      this.staticAnimation(this.complexTarget, '0px', 1),
    ]);

    this.target = document.createElement('div');
    this.elements.push(this.target);

    for (var i = 0; i < this.elements.length; i++)
      document.documentElement.appendChild(this.elements[i]);
  });

  teardown(function() {
    for (var i = 0; i < this.elements.length; i++) {
      if (this.elements[i].parent)
        this.elements[i].parent.removeChild(this.elements[i]);
    }
  });

  function simpleAnimationGroup() {
    return new AnimationGroup([new Animation(document.body, [], 2000), new Animation(document.body, [], 1000), new Animation(document.body, [], 3000)]);
  }

  function simpleAnimationSequence() {
    return new AnimationSequence([new Animation(document.body, [], 2000), new Animation(document.body, [], 1000), new Animation(document.body, [], 3000)]);
  }

  // FIXME: Remove _startOffset.
  // playerState is [startTime, currentTime, _startOffset?, offset?]
  // innerPlayerStates is a nested array tree of playerStates e.g. [[0, 0], [[1, -1], [2, -2]]]
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
    if (timingList[0] === null || typeof timingList[0] == 'number') {
      assert.equal(player.startTime, timingList[0], trace + ' startTime');
      assert.equal(player.currentTime, timingList[1], trace + ' currentTime');
    } else {
      _checkTimes(player._childPlayers[index], timingList[0], 0, trace + ' ' + index);
      _checkTimes(player, timingList.slice(1), index + 1, trace);
    }
  }

  test('playing an animationGroup works as expected', function() {
    tick(90);
    var p = document.timeline.play(simpleAnimationGroup());
    checkTimes(p, [null, 0], []);
    tick(100);
    checkTimes(p, [100, 0], [[100, 0], [100, 0], [100, 0]]);
    tick(300);
    checkTimes(p, [100, 200], [[100, 200], [100, 200], [100, 200]]);
    tick(1200);
    checkTimes(p, [100, 1100], [[100, 1100], [100, 1000], [100, 1100]]);
    tick(2200);
    checkTimes(p, [100, 2100], [[100, 2000], [100, 1000], [100, 2100]]);
    tick(3200);
    checkTimes(p, [100, 3000], [[100, 2000], [100, 1000], [100, 3000]]);
  });

  test('can seek an animationGroup', function() {
    tick(90);
    var p = document.timeline.play(simpleAnimationGroup());
    tick(100);
    checkTimes(p, [100, 0], [[100, 0], [100, 0], [100, 0]]);
    p.currentTime = 200;
    checkTimes(p, [-100, 200], [[-100, 200], [-100, 200], [-100, 200]]);
    p.currentTime = 1100;
    checkTimes(p, [-1000, 1100], [[-1000, 1100], [-1000, 1100], [-1000, 1100]]);
    p.currentTime = 2100;
    checkTimes(p, [-2000, 2100], [[-2000, 2100], [-2000, 2100], [-2000, 2100]]);
    p.currentTime = 3100;
    checkTimes(p, [-3000, 3100], [[-3000, 3100], [-3000, 3100], [-3000, 3100]]);
  });

  test('can startTime seek an animationGroup', function() {
    tick(90);
    var p = document.timeline.play(simpleAnimationGroup());
    tick(100);
    checkTimes(p, [100, 0], [[100, 0], [100, 0], [100, 0]]);
    p.startTime = -100;
    checkTimes(p, [-100, 200], [[-100, 200], [-100, 200], [-100, 200]]);
    p.startTime = -1000;
    checkTimes(p, [-1000, 1100], [[-1000, 1100], [-1000, 1000], [-1000, 1100]]);
    p.startTime = -2000;
    checkTimes(p, [-2000, 2100], [[-2000, 2000], [-2000, 1000], [-2000, 2100]]);
    p.startTime = -3000;
    checkTimes(p, [-3000, 3000], [[-3000, 2000], [-3000, 1000], [-3000, 3000]]);
  });

  test('playing an animationSequence works as expected', function() {
    tick(100);
    var p = document.timeline.play(simpleAnimationSequence());
    tick(110);
    checkTimes(p, [110, 0], [[110, 0], [2110, -2000], [3110, -3000]]);
    tick(210);
    checkTimes(p, [110, 100], [[110, 100], [2110, -1900], [3110, -2900]]);
    tick(2210);
    checkTimes(p, [110, 2100], [[110, 2000], [2110, 100], [3110, -900]]);
    tick(3210);
    checkTimes(p, [110, 3100], [[110, 2000], [2110, 1000], [3110, 100]]);
    tick(6210);
    checkTimes(p, [110, 6000], [[110, 2000], [2110, 1000], [3110, 3000]]);
  });

  test('can seek an animationSequence', function() {
    tick(100);
    var p = document.timeline.play(simpleAnimationSequence());
    tick(110);
    checkTimes(p, [110, 0], [[110, 0], [2110, -2000], [3110, -3000]]);
    p.currentTime = 100;
    checkTimes(p, [10, 100], [[10, 100], [2010, -1900], [3010, -2900]]);
    p.currentTime = 2100;
    checkTimes(p, [-1990, 2100], [[-1990, 2100], [10, 100], [1010, -900]]);
    p.currentTime = 3100;
    checkTimes(p, [-2990, 3100], [[-2990, 3100], [-990, 1100], [10, 100]]);
    p.currentTime = 6100;
    checkTimes(p, [-5990, 6100], [[-5990, 6100], [-3990, 4100], [-2990, 3100]]);
  });

  test('can startTime seek an animationSequence', function() {
    tick(100);
    var p = document.timeline.play(simpleAnimationSequence());
    tick(110);
    checkTimes(p, [110, 0], [[110, 0], [2110, -2000], [3110, -3000]]);
    p.startTime = 10;
    checkTimes(p, [10, 100], [[10, 100], [2010, -1900], [3010, -2900]]);
    p.startTime = -1990;
    checkTimes(p, [-1990, 2100], [[-1990, 2000], [10, 100], [1010, -900]]);
    p.startTime = -2990;
    checkTimes(p, [-2990, 3100], [[-2990, 2000], [-990, 1000], [10, 100]]);
    p.startTime = -5990;
    checkTimes(p, [-5990, 6000], [[-5990, 2000], [-3990, 1000], [-2990, 3000]]);
  });

  test('complex animation tree timing while playing', function() {
    tick(90);
    var player = document.timeline.play(this.complexSource);
    tick(100);
    checkTimes(player, [100, 0], [
      [100, 0], [ // 4
        [100, 0], [ // 1
          [102, -2], // 3
          [102, -2]]], // 2
      [100, 0], // 0
    ], 't = 100');
    tick(101);
    checkTimes(player, [100, 1], [
      [100, 1], [ // 4
        [100, 1], [ // 1
          [102, -1], // 3
          [102, -1]]], // 2
      [100, 1], // 0
    ], 't = 101');
    tick(102);
    checkTimes(player, [100, 2], [
      [100, 2], [ // 4
        [100, 2], [ // 1
          [102, 0], // 3
          [102, 0]]], // 2
      [100, 1], // 0
    ], 't = 102');
  });

  test('effects apply in the correct order', function() {
    tick(0);
    var player = document.timeline.play(this.complexSource);
    player.currentTime = 0;
    assert.equal(getComputedStyle(this.complexTarget).marginLeft, '0px');
    player.currentTime = 1;
    checkTimes(player, [-1, 1], [[-1, 1, 0], [[-1, 1, 0], [[1, -1, 0], [1, -1, 0]]], [-1, 1, 0]]);
    assert.equal(getComputedStyle(this.complexTarget).marginLeft, '1px');
    player.currentTime = 2;
    // TODO: When we seek we don't limit. Is this OK?
    checkTimes(player, [-2, 2], [[-2, 2, 0], [[-2, 2, 0], [[0, 0, 0], [0, 0, 0]]], [-2, 2, 0]]);
    assert.equal(getComputedStyle(this.complexTarget).marginLeft, '2px');
    player.currentTime = 3;
    assert.equal(getComputedStyle(this.complexTarget).marginLeft, '3px');
    player.currentTime = 4;
    assert.equal(getComputedStyle(this.complexTarget).marginLeft, '4px');
    player.currentTime = 5;
    assert.equal(getComputedStyle(this.complexTarget).marginLeft, '0px');
  });

  test('cancelling group players', function() {
    tick(0);
    var player = document.timeline.play(this.complexSource);
    tick(1);
    tick(4);
    assert.equal(getComputedStyle(this.complexTarget).marginLeft, '3px');
    player.cancel();
    assert.equal(player.currentTime, null);
    assert.equal(getComputedStyle(this.complexTarget).marginLeft, '0px');
  });

  test('redundant animation node wrapping', function() {
    tick(100);
    var animation = new AnimationSequence([
      this.staticAnimation(this.target, '0px', 1),
      new AnimationGroup([
        new AnimationSequence([
          this.staticAnimation(this.target, '1px', 1),
          this.staticAnimation(this.target, '2px', 1),
        ]),
      ]),
    ]);
    var player = document.timeline.play(animation);
    assert.equal(getComputedStyle(this.target).marginLeft, '0px');
    checkTimes(player, [100, 0], [
      [100, 0, 0, 0], [[ // 0
        [101, -1, 0, 1], // 1
        [102, -2, 1, 2]]] // 2
    ], 't = 100');
    tick(101);
    assert.equal(getComputedStyle(this.target).marginLeft, '1px');
    checkTimes(player, [100, 1], [
      [100, 1, 0, 0], [[ // 0
        [101, 0, 0, 1], // 1
        [102, -1, 1, 2]]] // 2
    ], 't = 101');
    tick(102);
    assert.equal(getComputedStyle(this.target).marginLeft, '2px');
    assert.equal(document.timeline.currentTime, 102);
    checkTimes(player, [100, 2], [ // FIXME: Implement limiting on group players
      [100, 1, 0, 0], [[ // 0
        [101, 1, 0, 1], // 1
        [102, 0, 1, 2]]] // 2
    ], 't = 102');
    tick(103);
    assert.equal(getComputedStyle(this.target).marginLeft, '0px');
    checkTimes(player, [100, 3], [ // FIXME: Implement limiting on group players
      [100, 1, 0, 0], [[ // 0
        [101, 1, 0, 1], // 1
        [102, 1, 1, 2]]] // 2
    ], 't = 103');
    if (this.target.parent)
      this.target.parent.removeChild(target);
  });

  test('delays on groups work correctly', function() {
    //   444
    //  1
    // 0
    //   33
    //   2
    var animation = new AnimationGroup([
      new AnimationGroup([
        this.staticAnimation(this.target, '4px', {duration: 3, delay: 1}),
        this.staticAnimation(this.target, '1px', {duration: 1, delay: 0}),
      ], {delay: 1}),
      new AnimationSequence([
        this.staticAnimation(this.target, '0px', {duration: 1, delay: 0}),
        this.staticAnimation(this.target, '3px', {duration: 2, delay: 1}),
        this.staticAnimation(this.target, '2px', {duration: 1, delay: -2}),
      ]),
    ]);
    var player = document.timeline.play(animation);
    tick(100);
    checkTimes(player, [100, 0], [
      [
        [101, -1],
        [101, -1],
      ], [
        [100, 0],
        [101, -1],
        [104, -4],
      ]
    ]);
    assert.equal(getComputedStyle(this.target).marginLeft, '0px');
    tick(101);
    assert.equal(getComputedStyle(this.target).marginLeft, '1px');
    tick(102);
    assert.equal(getComputedStyle(this.target).marginLeft, '2px');
    tick(103);
    assert.equal(getComputedStyle(this.target).marginLeft, '3px');
    tick(104);
    assert.equal(getComputedStyle(this.target).marginLeft, '4px');
    tick(105);
    assert.equal(getComputedStyle(this.target).marginLeft, '0px');
  });

  test('end delays on groups work correctly', function() {
    // 11
    //     4
    // 0
    //   33
    //   2
    var animation = new AnimationSequence([
      new AnimationSequence([
        this.staticAnimation(this.target, '1px', {duration: 2, endDelay: 2}),
        this.staticAnimation(this.target, '4px', {duration: 1, endDelay: 1}),
      ], {endDelay: -6}),
      new AnimationSequence([
        this.staticAnimation(this.target, '0px', {duration: 1, endDelay: 1}),
        this.staticAnimation(this.target, '3px', {duration: 2, endDelay: -2}),
        this.staticAnimation(this.target, '2px', {duration: 1, endDelay: 2}),
      ]),
    ]);
    var player = document.timeline.play(animation);
    tick(100);
    checkTimes(player, [100, 0], [
      [
        [100, 0],
        [104, -4],
      ], [
        [100, 0],
        [102, -2],
        [102, -2],
      ]
    ]);
    assert.equal(getComputedStyle(this.target).marginLeft, '0px');
    tick(101);
    assert.equal(getComputedStyle(this.target).marginLeft, '1px');
    tick(102);
    assert.equal(getComputedStyle(this.target).marginLeft, '2px');
    tick(103);
    assert.equal(getComputedStyle(this.target).marginLeft, '3px');
    tick(104);
    // FIXME: Group child player limiting bounds should match the parent player's limiting bounds.
    // assert.equal(getComputedStyle(this.target).marginLeft, '4px');
    // tick(105);
    // assert.equal(getComputedStyle(this.target).marginLeft, '0px');
  });

  // START RENEE'S TESTS.
  // FIXME: This test can be removed when this suite is finished.
  test('sources are working for basic operations', function() {
    var players = [];
    players.push(document.timeline.play(this.seqEmpty_source));
    players.push(document.timeline.play(this.seqSimple_source));
    players.push(document.timeline.play(this.seqWithSeq_source));
    players.push(document.timeline.play(this.seqWithGroup_source));
    players.push(document.timeline.play(this.seqWithEmptyGroup_source));
    players.push(document.timeline.play(this.seqWithEmptySeq_source));

    players.push(document.timeline.play(this.groupEmpty_source));
    players.push(document.timeline.play(this.groupSimple_source));
    players.push(document.timeline.play(this.groupWithSeq_source));
    players.push(document.timeline.play(this.groupWithGroup_source));
    players.push(document.timeline.play(this.groupWithEmptyGroup_source));
    players.push(document.timeline.play(this.groupWithEmptySeq_source));

    var length = players.length;

    tick(50);
    for (var i = 0; i < length; i++)
      players[i].pause();

    tick(100);
    for (var i = 0; i < length; i++)
      players[i].play();

    tick(200);
    for (var i = 0; i < length; i++)
      players[i].currentTime += 1;

    tick(300);
    for (var i = 0; i < length; i++)
      players[i].startTime += 1;

    tick(350);
    for (var i = 0; i < length; i++)
      players[i].reverse();

    tick(400);
    for (var i = 0; i < length; i++)
      players[i].finish();

    tick(500);
    tick(600);
    for (var i = 0; i < length; i++)
      players[i].cancel();

    for (var i = 0; i < length; i++)
      players[i].play();
  });

  test('pausing works as expected with an empty AnimationSequence', function() {
    var player = document.timeline.play(this.seqEmpty_source);
    tick(0);
    assert.equal(player.startTime, 0);
    assert.equal(player.currentTime, 0);

    player.pause();
    assert.equal(player.startTime, null);
    assert.equal(player.currentTime, 0);
  });

  test('pausing works as expected with a simple AnimationSequence', function() {
    var player = document.timeline.play(this.seqSimple_source);
    tick(0);
    checkTimes(player, [0, 0], [[0, 0], [500, -500]], 't = 0');

    tick(200);
    checkTimes(player, [0, 200], [[0, 200], [500, -300]], 't = 200');

    player.pause();
    checkTimes(player, [null, null], [[null, null], [null, null]], 't = 200');

    tick(300);
    checkTimes(player, [null, 200], [[null, 200], [null, -300]], 't = 300');

    player.play();
    checkTimes(player, [null, 200], [[null, 200], [null, -300]], 't = 300');

    tick(301);
    checkTimes(player, [101, 200], [[101, 200], [601, -300]], 't = 301');

    tick(701);
    checkTimes(player, [101, 600], [[101, 500], [601, 100]], 't = 701');

    player.pause();
    tick(711);
    checkTimes(player, [NaN, 600], [[NaN, 500], [NaN, 100]], 't = 711');

    player.play();
    tick(721);
    checkTimes(player, [121, 600], [[121, 500], [621, 100]], 't = 721');

    tick(1321);
    checkTimes(player, [121, 1000], [[121, 500], [621, 500]], 't = 1321');
  });

  // FIXME: This test fails because of a known issue.
  test('pausing works as expected with an AnimationSequence inside an AnimationSequence', function() {
    var player = document.timeline.play(this.seqWithSeq_source);
    tick(0);
    checkTimes(
        player,
        [0, 0], [
          [0, 0],
          [500, -500], [
            [1000, -1000],
            [1500, -1500]]],
        't = 0');

    tick(200);
    checkTimes(
        player,
        [0, 200], [
          [0, 200],
          [500, -300], [
            [1000, -800],
            [1500, -1300]]],
        't = 200');

    player.pause();
    checkTimes(
        player,
        [null, null], [
          [null, null],
          [null, null], [
            [null, null],
            [null, null]]],
        't = 200');

    tick(300);
    checkTimes(
        player,
        [null, 200], [
          [null, 200],
          [null, -300], [
            [null, -800],
            [null, -1300]]],
        't = 300');

    player.play();
    tick(310);
    checkTimes(
        player,
        [110, 200], [
          [110, 200],
          [610, -300], [
            [1110, -800],
            [1610, -1300]]],
        't = 310');

    tick(1300);
    checkTimes(
        player,
        [110, 1190], [
          [110, 500],
          [610, 500], [
            [1110, 190],
            [1610, -310]]],
        't = 1300');

    player.pause();
    checkTimes(
        player,
        [null, null], [
          [null, 500],
          [null, 500], [
            [null, null],
            [null, null]]],
        't = 1300');

    tick(1400);
    checkTimes(
        player,
        [null, 1190], [
          [null, 500],
          [null, 500], [
            [null, 190],
            [null, -310]]],
        't = 1400');

    player.play();
    checkTimes(
        player,
        [null, 1190], [
          [null, 500],
          [null, 500], [
            [null, 190],
            [null, -310]]],
        't = 1400');

    tick(1410);
    checkTimes(
        player,
        [220, 1190], [
          [220, 500],
          [720, 500], [
            [1220, 190],
            [1720, -310]]],
        't = 1410');

    tick(1600);
    checkTimes(
        player,
        [220, 1380], [
          [220, 500],
          [720, 500], [
            [1220, 380],
            [1720, -120]]],
        't = 1600');

    player.pause();
    checkTimes(
        player,
        [null, null], [
          [null, 500],
          [null, 500], [
            [null, null],
            [null, null]]],
        't = 1600');

    tick(1700);
    checkTimes(
        player,
        [null, 1380], [
          [null, 500],
          [null, 500], [
            [null, 380],
            [null, -120]]],
        't = 1700');

    player.play();
    tick(1710);
    checkTimes(
        player,
        [330, 1380], [
          [330, 500],
          [830, 500], [
            [1330, 380],
            [1830, -120]]],
        't = 1710');

    // These steps finish (2, 0) but don't finish (2, 1). This (somehow) causes the currentTime of
    // (2, 0) to advance past its duration after it has been paused and unpaused.
    tick(1840);
    checkTimes(
        player,
        [330, 1510], [
          [330, 500],
          [830, 500], [
            [1330, 500],
            [1830, 10]]],
        't = 1840');

    player.pause();
    tick(1850);
    checkTimes(
        player,
        [NaN, 1510], [
          [NaN, 500],
          [NaN, 500], [
            [NaN, 500],
            [NaN, 10]]],
        't = 1850');

    player.play();
    tick(1860);
    checkTimes(
        player,
        [350, 1510], [
          [350, 500],
          [850, 500], [
            [1350, 500], // FIXME: This check fails because of a known issue.
            [1850, 10]]],
        't = 1850');

    tick(2400);
    checkTimes(
        player,
        [350, 2000], [
          [350, 500],
          [850, 500], [
            [1350, 500], // FIXME: This check fails because of a known issue.
            [1850, 500]]],
        't = 2400');
  });

  test('pausing works as expected with an AnimationGroup inside an AnimationSequence', function() {
    var player = document.timeline.play(this.seqWithGroup_source);
    tick(0);
    checkTimes(
        player,
        [0, 0], [
          [0, 0],
          [500, -500], [
            [1000, -1000],
            [1000, -1000]]],
        't = 0');

    tick(200);
    checkTimes(
        player,
        [0, 200], [
          [0, 200],
          [500, -300], [
            [1000, -800],
            [1000, -800]]],
        't = 200');

    player.pause();
    checkTimes(
        player,
        [null, null], [
          [null, null],
          [null, null], [
            [null, null],
            [null, null]]],
        't = 200');

    tick(300);
    checkTimes(
        player,
        [null, 200], [
          [null, 200],
          [null, -300], [
            [null, -800],
            [null, -800]]],
        't = 300');

    player.play();
    tick(310);
    checkTimes(
        player,
        [110, 200], [
          [110, 200],
          [610, -300], [
            [1110, -800],
            [1110, -800]]],
        't = 310');

    tick(1310);
    checkTimes(
        player,
        [110, 1200], [
          [110, 500],
          [610, 500], [
            [1110, 200],
            [1110, 200]]],
        't = 1310');

    player.pause();
    checkTimes(
        player,
        [null, null], [
          [null, 500],
          [null, 500], [
            [null, null],
            [null, null]]],
        't = 1310');

    tick(1400);
    checkTimes(
        player,
        [null, 1200], [
          [null, 500],
          [null, 500], [
            [null, 200],
            [null, 200]]],
        't = 1410');

    player.play();
    tick(1410);
    checkTimes(
        player,
        [210, 1200], [
          [210, 500],
          [710, 500], [
            [1210, 200],
            [1210, 200]]],
        't = 1410');

    tick(1610);
    checkTimes(
        player,
        [210, 1400], [
          [210, 500],
          [710, 500], [
            [1210, 400],
            [1210, 400]]],
        't = 1610');

    player.pause();
    tick(1810);
    checkTimes(
        player,
        [null, 1400], [
          [null, 500],
          [null, 500], [
            [null, 400],
            [null, 400]]],
        't = 1810');

    player.play();
    tick(1820);
    checkTimes(
        player,
        [420, 1400], [
          [420, 500],
          [920, 500], [
            [1420, 400],
            [1420, 400]]],
        't = 1820');

    tick(2020);
    checkTimes(
        player,
        [420, 1500], [
          [420, 500],
          [920, 500], [
            [1420, 500],
            [1420, 500]]],
        't = 2020');

    player.pause();
    checkTimes(
        player,
        [null, 1500], [
          [null, 500],
          [null, 500], [
            [null, 500],
            [null, 500]]],
        't = 2020');
  });

  test('pausing works as expected with an empty AnimationSequence inside an AnimationSequence', function() {
    var player = document.timeline.play(this.seqWithEmptySeq_source);
    tick(0);
    checkTimes(
        player,
        [0, 0], [0, 0],
        't = 0');

    player.pause();
    checkTimes(
        player,
        [null, 0], [null, 0],
        't = 0 after pause');
  });

  test('pausing works as expected with an empty AnimationGroup inside an AnimationSequence', function() {
    var player = document.timeline.play(this.seqWithEmptyGroup_source);
    tick(0);
    checkTimes(
        player,
        [0, 0], [0, 0],
        't = 0');

    player.pause();
    checkTimes(
        player,
        [null, 0], [null, 0],
        't = 0 after pause');
  });

  test('playState works for groups', function() {
    var target = document.createElement('div');
    document.body.appendChild(target);
    var anim = new AnimationSequence([new Animation(target, [], 100), new Animation(target, [], 100)]);
    var p = document.timeline.play(anim);
    assert.equal(p.playState, 'pending');
    tick(1);
    assert.equal(p.playState, 'running');
    assert.equal(p._childPlayers[0]._player.playState, 'running');
    assert.equal(p._childPlayers[1]._player.playState, 'running');
    tick(101);
    assert.equal(p.playState, 'running');
    assert.equal(p._childPlayers[0]._player.playState, 'finished');
    assert.equal(p._childPlayers[1]._player.playState, 'running');
    p.pause();
    assert.equal(p.playState, 'pending');
    assert.equal(p._childPlayers[0]._player.playState, 'paused');
    assert.equal(p._childPlayers[1]._player.playState, 'pending');
    tick(102);
    assert.equal(p.playState, 'paused');
    assert.equal(p._childPlayers[0]._player.playState, 'paused');
    assert.equal(p._childPlayers[1]._player.playState, 'paused');
    p.play();
    assert.equal(p.playState, 'pending');
    assert.equal(p._childPlayers[0]._player.playState, 'pending');
    assert.equal(p._childPlayers[1]._player.playState, 'pending');
    tick(103);
    assert.equal(p.playState, 'running');
    assert.equal(p._childPlayers[0]._player.playState, 'finished');
    assert.equal(p._childPlayers[1]._player.playState, 'running');
    tick(204);
    assert.equal(p.playState, 'finished');
    assert.equal(p._childPlayers[0]._player.playState, 'finished');
    assert.equal(p._childPlayers[1]._player.playState, 'finished');
  });

  test('pausing works as expected with an empty AnimationGroup', function() {
    var player = document.timeline.play(this.groupEmpty_source);
    tick(0);
    assert.equal(player.startTime, 0);
    assert.equal(player.currentTime, 0);

    player.pause();
    assert(isNaN(player.startTime));
    assert.equal(player.currentTime, 0);
  });

  test('pausing works as expected with a simple AnimationGroup', function() {
    var player = document.timeline.play(this.groupSimple_source);
    tick(0);
    checkTimes(player, [0, 0], [[0, 0], [0, 0]], 't = 0');

    tick(200);
    checkTimes(player, [0, 200], [[0, 200], [0, 200]], 't = 200');

    player.pause();
    checkTimes(player, [NaN, 200], [[NaN, 200], [NaN, 200]], 't = 200');

    tick(300);
    checkTimes(player, [NaN, 200], [[NaN, 200], [NaN, 200]], 't = 300');

    player.play();
    tick(301);
    checkTimes(player, [101, 200], [[101, 200], [101, 200]], 't = 301');

    tick(601);
    checkTimes(player, [101, 500], [[101, 500], [101, 500]], 't = 601');

    player.pause();
    checkTimes(player, [NaN, 500], [[NaN, 500], [NaN, 500]], 't = 601');

    player.play();
    tick(602);
    checkTimes(player, [602, 0], [[602, 0], [602, 0]], 't = 602');
  });

  // FIXME: This test fails because of a known issue.
  test('pausing works as expected with an AnimationSequence inside an AnimationGroup', function() {
    var player = document.timeline.play(this.groupWithSeq_source);
    tick(0);
    checkTimes(
        player,
        [0, 0], [
          [0, 0],
          [0, 0], [
            [0, 0],
            [500, -500]]],
        't = 0');

    tick(200);
    checkTimes(
        player,
        [0, 200], [
          [0, 200],
          [0, 200], [
            [0, 200],
            [500, -300]]],
        't = 200');

    player.pause();
    checkTimes(
        player,
        [NaN, 200], [
          [NaN, 200],
          [NaN, 200], [
            [NaN, 200],
            [NaN, -300]]],
        't = 200');

    tick(310);
    checkTimes(
        player,
        [NaN, 200], [
          [NaN, 200],
          [NaN, 200], [
            [NaN, 200],
            [NaN, -300]]],
        't = 310');

    player.play();
    tick(320);
    checkTimes(
        player,
        [120, 200], [
          [120, 200],
          [120, 200], [
            [120, 200],
            [620, -300]]],
        't = 320');

    tick(800);
    checkTimes(
        player,
        [120, 680], [
          [120, 500],
          [120, 500], [
            [120, 500],
            [620, 180]]],
        't = 800');

    player.pause();
    checkTimes(
        player,
        [NaN, 680], [
          [NaN, 500],
          [NaN, 500], [
            [NaN, 500],
            [NaN, 180]]],
        't = 800');

    tick(900);
    checkTimes(
        player,
        [NaN, 680], [
          [NaN, 500],
          [NaN, 500], [
            [NaN, 500],
            [NaN, 180]]],
        't = 900');

    player.play();
    tick(910);
    checkTimes(
        player,
        [230, 680], [
          [230, 500],
          [230, 500], [
            [230, 500], // FIXME: This check fails because of a known issue.
            [730, 180]]],
        't = 910');

    tick(1300);
    checkTimes(
        player,
        [230, 1000], [
          [230, 500],
          [230, 500], [
            [230, 500], // FIXME: This check fails because of a known issue.
            [730, 500]]],
        't = 1300');

    player.pause();
    checkTimes(
        player,
        [NaN, 1000], [
          [NaN, 500],
          [NaN, 500], [
            [NaN, 500], // FIXME: This check fails because of a known issue.
            [NaN, 500]]],
        't = 1300');

    tick(1310);
    checkTimes(
        player,
        [NaN, 1000], [
          [NaN, 500],
          [NaN, 500], [
            [NaN, 500], // FIXME: This check fails because of a known issue.
            [NaN, 500]]],
        't = 1310');

    player.play();
    tick(1400);
    checkTimes(
        player,
        [1400, 0], [
          [1400, 0],
          [1400, 0], [
            [1400, 0],
            [1900, -500]]],
        't = 1400');
  });

  // test('pausing works as expected with an AnimationGroup inside an AnimationGroup', function() {
  //   tick(0);
  //   var player = document.timeline.play(this.groupWithGroup_source);
  //   // check: player,
  //   //        player.childPlayers[0],
  //   //        player.childPlayers[1],
  //   //        player.childPlayers[2],
  //   //        player.childPlayers[2].childPlayers[0],
  //   //        player.childPlayers[2].childPlayers[1]
  //   // assert.equal(player.startTime, X);
  //   // assert.equal(player.currentTime, X);
  //   // assert.equal(player.childPlayers[0].startTime, X);
  //   // assert.equal(player.childPlayers[0].currentTime, X);
  //   // assert.equal(player.childPlayers[1].startTime, X);
  //   // assert.equal(player.childPlayers[1].currentTime, X);
  //   // assert.equal(player.childPlayers[2].startTime, X);
  //   // assert.equal(player.childPlayers[2].currentTime, X);
  //   // assert.equal(player.childPlayers[2].childPlayers[0].startTime, X);
  //   // assert.equal(player.childPlayers[2].childPlayers[0].currentTime, X);
  //   // assert.equal(player.childPlayers[2].childPlayers[1].startTime, X);
  //   // assert.equal(player.childPlayers[2].childPlayers[1].currentTime, X);
  //   tick(200);
  //   // check
  //   player.pause();
  //   // check
  //   tick(300);
  //   // check
  //   player.play();
  //   tick(300);
  //   // check
  // });

  // test('pausing works as expected with an empty AnimationSequence inside an AnimationGroup', function() {
  //   tick(0);
  //   var player = document.timeline.play(this.groupWithEmptySeq_source);
  //   // check: player,
  //   //        player.childPlayers[0]
  //   // assert.equal(player.startTime, X);
  //   // assert.equal(player.currentTime, X);
  //   // assert.equal(player.childPlayers[0].startTime, X);
  //   // assert.equal(player.childPlayers[0].currentTime, X);
  //   player.pause();
  //   // check
  // });

  // test('pausing works as expected with an empty AnimationGroup inside an AnimationGroup', function() {
  //   tick(0);
  //   var player = document.timeline.play(this.groupWithEmptyGroup_source);
  //   // check: player,
  //   //        player.childPlayers[0]
  //   // assert.equal(player.startTime, X);
  //   // assert.equal(player.currentTime, X);
  //   // assert.equal(player.childPlayers[0].startTime, X);
  //   // assert.equal(player.childPlayers[0].currentTime, X);
  //   player.pause();
  //   // check
  // });

  // // FIXME: This is just here as a baseline during development. REMOVE.
  // test('pausing works as expected with a simple Animation', function() {
  //   tick(0);
  //   var target = document.createElement('div');
  //   var player = document.timeline.play(this.animationMargin(target));
  //   assert.equal(player.startTime, 0);
  //   assert.equal(player.currentTime, 0);
  //   tick(200);
  //   assert.equal(player.startTime, 0);
  //   assert.equal(player.currentTime, 200);
  //   player.pause();
  //   assert.equal(player.startTime, null);
  //   assert.equal(player.currentTime, 200);
  //   tick(300);
  //   assert.equal(player.startTime, null);
  //   assert.equal(player.currentTime, 200);
  //   player.play();
  //   tick(300);
  //   assert.equal(player.startTime, 100);
  //   assert.equal(player.currentTime, 200);
  //   tick(600);
  //   setTicking(true);
  //   assert.equal(player.startTime, 100);
  //   assert.equal(player.currentTime, 500);
  // });

});
