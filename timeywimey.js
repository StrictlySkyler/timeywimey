/*
"timeywimey" is a task scheduler and idle-detector for JavaScript, 
by Skyler Brungardt and David Powell.
Copyright (C) 2013  Skyler Brungardt

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

/**
 * Adds TimeyWimey to the global scope, exposed as "TW".
 * @param  {Object} root The global object, usually 'window', 'module.exports', 
 *                       or similar.
 * @return {Boolean}      Returns true when initialized.
 */
!(function setupTimeyWimey (root) {

  /**
   * Constructor.  Adds event listeners to catch for user input, and initializes
   * timer for idle detection.
   */
  function TimeyWimey () {

    /**
     * Resets the idle counter when user input is detected.
     * @return {Number} Returns the reset counter.
     */
    function userInput () {
      count = 0;

      return count;
    }
    
    var i;
    var count = 0;
    var _this = this;
    var events = [
      'blur',
      'click',
      'contextmenu',
      'dblclick',
      'devicelight',
      'devicemotion',
      'deviceorientation',
      'deviceproximity',
      'drag',
      'dragend',
      'dragenter',
      'dragleave',
      'dragover',
      'dragstart',
      'drop',
      'focus',
      'fullscreenchange',
      'keydown',
      'keypress',
      'keyup',
      'mousedown',
      'mouseenter',
      'mouseleave',
      'mousemove',
      'mouseout',
      'mouseover',
      'mouseup',
      'resize',
      'scroll',
      'select',
      'show',
      'submit',
      'touchend',
      'touchenter',
      'touchleave',
      'touchmove',
      'touchstart',
      'wheel'
    ];
    
    /**
     * Initializes a timeout to track the delay between when it's called, and 
     * when it actually initializes.  There's a fuzziness which is expected, but
     * anything longer than the fuzziness means the JS engine is working on
     * something else, and thus isn't idle.
     * 
     * @return {Number} Returns the timeout id.
     */
    var checkIdle = function checkIdle () {
      var lastCalled = Date.now();
      var fuzziness = 2;

      /**
       * Uses requestAnimationFrame to track the difference between when it
       * was called last, and when it executes. Determines an idle state by
       * speed at which it gets called over a short period of time, and when
       * idle-ish, executes any queued tasks.
       * @return {Function} Recursive; retruns checkIdle function.
       */
      return requestAnimationFrame(function idle () {
        var now = Date.now();
        var gap = now - lastCalled;

        if (gap > (_this.tick + fuzziness)) {

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

        return checkIdle();
      }, _this.tick);
    };

    this.idleThreshold = 100;
    this.tick = 17;
    this.tasks = {};
    this.defaultInterval = 100;

    if (root.document) {
      for (i = 0; i < events.length; i++) {

        document.addEventListener(events[i], userInput);

      }
    }

    checkIdle();

  }

  /**
   * Queues a task to be executed after a given delay.  
   * Similar to pubsub pattern.
   * 
   * @param  {String}   label    Label identifying the tasks to execute.
   * @param  {Function} callback The task to execute.
   * @param  {Object}   options  Object containing two properties:
   *                             'queue', and 'animation'.
   *                             'queue' determines whether to add the callback
   *                             to an array or not.  
   *                             Defaults to false.
   *                             'animation' determines whether to use 
   *                             requestAnimationFrame or not.  
   *                             Defaults to true.
   * @return {Object}            Returns the labeled object.
   */ 
  TimeyWimey.prototype.queueTask = function queueTask (label, 
                                                       callback, 
                                                       options) {

    var _this = this;

    options = options ? options : {};
    options.queue = options.queue || false;
    options.animation = options.animation || true;

    function timer () {
      return _this.executeTasks(label);
    }

    function cancelTask () {
      if (requestAnimationFrame) {
        cancelAnimationFrame(_this.tasks[label].timer);
      } else {
        clearTimeout(_this.tasks[label].timer);
      }
    }

    if (this.tasks[label]) {
      if (Date.now() - this.tasks[label].start >= this.tasks[label].timer) {

        cancelTask();
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
        queue: options.queue,
        animation: options.animation
      };
    }

    if (this.tasks[label].animation
      && requestAnimationFrame) {
      this.tasks[label].timer = requestAnimationFrame(timer);
    } else {
      this.tasks[label].timer = setTimeout(timer, this.tasks[label].interval);
    }

    return this.tasks[label];

  };

  /**
   * Immediately executes any tasks queued for a given label.
   * @param  {String} label The label for which tasks will be executed.
   * @return {Boolean}       Returns true if tasks were executed, false if none
   *                         existed for that label.
   */
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

  /**
   * Executes the next task in any given queue, removing it from the queue.
   * @param  {String} label The label corresponding to the desired queue.
   * @return {Function}       Returns the task executed.
   */
  TimeyWimey.prototype.nextTask = function nextTask (label) {

    if (this.tasks[label].callbacks) {
      this.tasks[label].callbacks[0]();

      return this.tasks[label].callbacks.shift();
    }

  };

  /**
   * Executes the most recently added task to any queue, removing it from the
   * queue.
   * @param  {String} label The label corresponding to the desired queue.
   * @return {Function}       Returns the task executed.
   */
  TimeyWimey.prototype.lastTask = function lastTask (label) {

    if (this.tasks[label].callbacks) {
      this.tasks[label].callbacks[this.tasks[label].callbacks.length - 1]();

      return this.tasks[label].callbacks.pop();
    }

  };

  /**
   * Executes any and all tasks currently queued.
   * @return {Boolean} Returns true after triggering executeTasks() method for
   *                   each queue.
   */
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

    return true;
  };

  /**
   * Clears out a specific task, removing any items in its queue along with 
   * metadata.
   * @param  {String} label The task label to flush.
   * @return {Object}       The task which has been flushed.
   */
  TimeyWimey.prototype.flushTask = function flushTask (label) {

    var task = this.tasks[label];

    delete this.tasks[label];

    return task;

  };

  /**
   * Clears all tasks, removing all queued items and metadata.  Start fresh!
   * @return {Object} An object containing the tasks which have been deleted.
   */
  TimeyWimey.prototype.flushAll = function flushAll () {

    var tasks = this.tasks;
    var each;

    for (each in this.tasks) {
      if (this.tasks.hasOwnProperty(each)) {
        delete this.tasks[each];
      }
      
    }

    return tasks;

  };

  /**
   * Called when a Timeywimey thinks it is about to execute a long-running task.
   * Should be overridden by specific implementaions, in order to provide custom
   * feedback to the user; e.g. loading widgets, and the like.
   * @return {Object} Logs to the console by default.
   */
  TimeyWimey.prototype.working = function working () {
    return console.log('Handling a potentially long-running task...');
  };

  /**
   * Called when Timeywimey finishes what it thinks was a long-running task.
   * Should be overridden to match the working() method, providing custom
   * feedback to the user that the task is now complete.
   * @return {Object} Logs to the console by default.
   */
  TimeyWimey.prototype.finished = function finished () {
    return console.log('...Potentially long-running task complete.');
  };

  root.TW = new TimeyWimey();

}(this));