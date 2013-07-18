// Todo: add stepping through the tasks one by one!
!(function setupSchedule (root) {

  function Schedule () {
    var lastIdle = Date.now();
    var count = 0;
    var _this = this;
    
    var checkIdle = function checkIdle () {

      setTimeout(function idle () {
        var now = Date.now();

        if (now - lastIdle > _this.tick) {

          count = 0;

          _this.idle = false;

        } else {

          lastIdle = now;
          count++;

        }

        console.log(now - lastIdle);

        if (count >= _this.idleThreshold) {
          _this.idle = true;

          _this.executeIdleTasks();
        }

        checkIdle();
      }, this.tick);
    };

    this.idleThreshold = 100;
    this.tick = 50;
    this.tasks = {};
    this.defaultInterval = 1000;

    checkIdle();
  }

  Schedule.prototype.scheduleTask = function scheduleTask (label, callback) {
    var _this = this;

    if (this.tasks[label]) {
      if (Date.now() - this.tasks[label].start >= this.tasks[label].timer) {
        clearTimeout(this.tasks[label].timer);
      }

      this.tasks[label].callbacks = this.tasks[label].callbacks || [];
      this.tasks[label].callbacks.push(callback);

    } else {

      this.tasks[label] = {
        callbacks: [callback],
        interval: this.defaultInterval,
        start: Date.now()
      };
    }

    this.tasks[label].timer = setTimeout(function () {
      return _this.executeTasks(label);
    }, this.tasks[label].interval);

    return this.tasks[label];

  };

  Schedule.prototype.executeTasks = function executeTasks (label) {
    var i;
    var _callbacks;
    var duration;

    if (this.tasks[label].callbacks) {
      console.log('Executing deferred tasks for:', label);

      if (this.tasks[label].interval > this.defaultInterval) {
        this.working();
      }

      this.tasks[label].start = Date.now();

      _callbacks = this.tasks[label].callbacks;
      delete this.tasks[label].callbacks;

      for (i = 0; i < _callbacks.length; i++) {
        _callbacks[i]();
      }

      this.tasks[label].end = Date.now();


      duration = this.tasks[label].end - this.tasks[label].start;

      if (duration > this.tasks[label].interval) {
        this.tasks[label].interval = duration;
        this.finished();
      }

      return true;
    } else {

      return false;
    }

  };

  Schedule.prototype.executeIdleTasks = function executeIdleTasks () {
    var each;

    console.log('Idle detected.  Executing available tasks.');
    for (each in this.tasks) {
      if (this.hasOwnProperty(each)) {
        this.executeTasks(each);
      }
    }
  };

  Schedule.prototype.working = function working () {
    console.log('Handling a potentially long-running task...');
  };

  Schedule.prototype.finished = function finished () {
    console.log('...Potentially long-running task complete.');
  };

  root.Schedule = new Schedule();

}(this));