suite('timing-tests', function() {
  setup(function() {
    document.timeline._players = [];
  });

  test('animation iterations', function() {
    var anim = new Animation(document.body, [], {
      duration: 2000,
      iterations: 2,
      iterationStart: 0.5
    });
    assert.equal(anim.activeDuration, 4000);
  });

  test('group iterations', function() {
    var anim = new Animation(document.body, [], {
      duration: 2000
    });
    var group = new AnimationGroup([anim], {
      iterations: 2,
      iterationStart: 0.5/*,
      duration: 2000*/
      // note: fails even with explicit duration here, as opposed to 'auto'
    });
    assert.equal(group.activeDuration, 4000);
  });
});
