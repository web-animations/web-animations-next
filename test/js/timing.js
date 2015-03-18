suite('timing', function() {
  setup(function() {
    webAnimations1.timeline._players = [];
  });

  test('changing timing iterations mid-animation', function() {
    var animation = new Animation(document.body, [], { duration: 1000 });

    // TODO: access internal _timing for now, until .timing is properly generated
    var timing = animation._timing;

    assert.equal(timing.duration, 1000);
    assert.equal(timing.iterations, 1.0);

    var player = document.timeline.play(animation);
    tick(50);
    assert.equal(player.currentTime, 0);

    tick(350);
    assert.equal(player.currentTime, 300);

    timing.iterations = 0.5;
    animation.timing.iterations = 0.5;
    tick(850);
    assert.equal(player.currentTime, 500);
  });

  test('immediate pause and play later', function() {
    var animation = new Animation(document.body, [], { duration: 1000 });
    var player = document.timeline.play(animation);
    player.pause();

    tick(50);
    assert(!player.currentTime);
    assert(!player.startTime);

    tick(150);
    assert(!player.currentTime);
    assert(!player.startTime);

    player.play();

    tick(250);
    assert.equal(player.currentTime, 100);
    assert.equal(player.startTime, 150);
  });

  test('composing playbackRate', function() {
    var target = document.createElement('div');
    target.style.position = 'absolute';
    document.body.appendChild(target);

    var timing = { duration: 1000, playbackRate: 0.5 };
    var animation = new Animation(target, [
      { left: '0px' },
      { left: '1000px' }
    ], timing);

    // 0.5 * 2.0 == 1, so offsetLeft==currentTime
    var group = new AnimationGroup([animation], { playbackRate: 2.0 });
    var player = document.timeline.play(animation);

    tick(50);
    assert.equal(player.startTime, 50);

    tick(150);
    assert.equal(player.currentTime, 100);
    assert.equal(target.offsetLeft, 100);
  });

  test('player playbackRate', function() {
    var target = document.createElement('div');
    target.style.position = 'absolute';
    document.body.appendChild(target);

    var timing = { duration: 1000, playbackRate: 0.5 };
    var animation = new Animation(target, [
      { left: '0px' },
      { left: '1000px' }
    ], timing);

    var player = document.timeline.play(animation);

    // 0.5 * 2.0 == 1, so offsetLeft==currentTime
    player.playbackRate = 2.0;

    tick(50);
    assert.equal(player.startTime, 50);

    tick(150);
    assert.equal(player.currentTime, 100);
    assert.equal(target.offsetLeft, 100);
  });

  test('pause and scrub', function() {
    // note that this functions natively. However, note that AnimationGroup
    // is not native on M41, so it still fails there.
    var animation = new Animation(document.body, [], { duration: 1000 });
    var player = document.timeline.play(animation);
    player.pause();

    player.currentTime = 500;
    assert.equal(player.currentTime, 500);
  });

  test('pause and scrub group', function() {
    // note that this functions natively. However, note that AnimationGroup
    // is not native on M41, so it still fails there.
    var animation = new Animation(document.body, [], { duration: 1000 });
    var group = new AnimationGroup([animation]);
    var player = document.timeline.play(group);
    player.pause();

    player.currentTime = 500;
    assert.equal(player.currentTime, 500);
  });

  test('pause, scrub and play', function() {
    var target = document.createElement('div');
    document.body.appendChild(target);

    var player = target.animate([
      { background: 'blue' },
      { background: 'red' }
    ], { duration: 1000 });
    tick(100);
    player.pause();

    player.currentTime = 200;
    // http://www.w3.org/TR/web-animations/#the-current-time-of-a-player
    // currentTime should now mean 'hold time' - this allows scrubbing.
    assert.equal(player.currentTime, 200);
    player.play();

    tick(200);
    tick(300);
    assert.equal(player.currentTime, 300);
    assert.equal(player.startTime, 0);
  });

  test('sanity-check NaN timing', function() {
    // This has no actual tests, but will infinite loop without fix.

    var player = document.body.animate([], {
      duration: 2000,
      easing: 'ease-in'  // fails only with cubic easing, not linear
    });
    tick(100);
    player.currentTime = NaN;
    tick(200);

    player = document.body.animate([], { duration: NaN, easing: 'ease-out' });
    tick(300);
  });

  test('can set fill:none on group', function() {
    var timing = webAnimationsShared.makeTiming({fill: 'none'}, true);
    assert.equal(timing.fill, 'none');
  });
});
