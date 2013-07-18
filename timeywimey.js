// Todo: 
// 2. Tracking for user input!
!(function setupTimeyWimey (root) {

  function TimeyWimey () {
    
    var count = 0;
    var _this = this;
    
    var checkIdle = function checkIdle () {
      var lastCalled = Date.now();

      setTimeout(function idle () {
        var now = Date.now();
        var gap = now - lastCalled;

        if (gap > (_this.tick + 2)) {

          count = 0;

          _this.idle = false;

        } else {

          lastCalled = now;
          count++;

        }

        if (count >= _this.idleThreshold) {
          
          _this.idle = true;

          _this.executeIdleTasks();
        }

        checkIdle();
      }, _this.tick);
    };

    this.idleThreshold = 100;
    this.tick = 10;
    this.tasks = {};
    this.defaultInterval = 100;

    checkIdle();
  }

  TimeyWimey.prototype.queueTask = function queueTask (label, callback, queue) {
    var _this = this;
    queue = queue || false;

    if (this.tasks[label]) {
      if (Date.now() - this.tasks[label].start >= this.tasks[label].timer) {
        clearTimeout(this.tasks[label].timer);
      }

      this.tasks[label].callbacks = this.tasks[label].callbacks || [];

      if (this.tasks[label].queue) {
        this.tasks[label].callbacks.push(callback);
      } else {
        this.tasks[label].callbacks = [callback];
      }
      

    } else {

      this.tasks[label] = {
        callbacks: [callback],
        interval: this.defaultInterval,
        start: Date.now(),
        'queue': queue
      };
    }

    this.tasks[label].timer = setTimeout(function () {
      return _this.executeTasks(label);
    }, this.tasks[label].interval);

    return this.tasks[label];

  };

  TimeyWimey.prototype.executeTasks = function executeTasks (label) {
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

  TimeyWimey.prototype.nextTask = function nextTask (label) {

    if (this.tasks[label].callbacks) {
      this.tasks[label].callbacks[0]();

      return this.tasks[label].callbacks.shift();
    }

  };

  TimeyWimey.prototype.lastTask = function lastTask (label) {

    if (this.tasks[label].callbacks) {
      this.tasks[label].callbacks[this.tasks[label].callbacks.length - 1]();

      return this.tasks[label].callbacks.pop();
    }

  };

  TimeyWimey.prototype.executeIdleTasks = function executeIdleTasks () {
    var each;

    for (each in this.tasks) {
      if (this.tasks.hasOwnProperty(each)) {

        if (this.tasks[each].callbacks) {

          this.tasks[each].interval = this.defaultInterval;
          this.executeTasks(each);
        }
        
      }
    }
  };

  TimeyWimey.prototype.working = function working () {
    console.log('Handling a potentially long-running task...');
  };

  TimeyWimey.prototype.finished = function finished () {
    console.log('...Potentially long-running task complete.');
  };

  root.TW = new TimeyWimey();

}(this));