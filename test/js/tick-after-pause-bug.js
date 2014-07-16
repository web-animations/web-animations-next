suite('tick-after-pause-bug', function() {
    test('pause-tick-play-tick does not advance the current time', function() {
    var player = document.timeline.play(
        new Animation(
            document.createElement('div'),
            [
            {backgroundColor: 'black'},
            {backgroundColor: 'white'}
            ],
            500
            )
        );
    tick(0);
    assert.equal(player.startTime, 0);
    assert.equal(player.currentTime, 0);

    player.pause();
    tick(400) // Tick!
    assert(isNaN(player.startTime));
    assert.equal(player.currentTime, 0);

    player.play();
    tick(402);
    assert.equal(player.startTime, 402);
    assert.equal(player.currentTime, 0); // Current time has NOT changed.

    tick(410);
    assert.equal(player.startTime, 402);
    assert.equal(player.currentTime, 8);
    });

    test('pause-play-tick advances currentTime.', function() {
    var player = document.timeline.play(
        new Animation(
            document.createElement('div'),
            [
            {backgroundColor: 'black'},
            {backgroundColor: 'white'}
            ],
            500
            )
        );
    tick(0);
    assert.equal(player.startTime, 0);
    assert.equal(player.currentTime, 0);

    player.pause(); // No tick.
    assert(isNaN(player.startTime));
    assert.equal(player.currentTime, 0);

    player.play();
    tick(402);
    assert.equal(player.startTime, 0);
    assert.equal(player.currentTime, 402); // Current time has changed.

    tick(410);
    assert.equal(player.startTime, 0);
    assert.equal(player.currentTime, 410);
    });
});
