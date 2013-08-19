#
#"timeywimey" is a task scheduler and idle-detector for JavaScript, 
#by Skyler Brungardt and David Powell.
#Copyright (C) 2013  Skyler Brungardt
#
#This program is free software: you can redistribute it and/or modify
#it under the terms of the GNU General Public License as published by
#the Free Software Foundation, either version 3 of the License, or
#(at your option) any later version.
#
#This program is distributed in the hope that it will be useful,
#but WITHOUT ANY WARRANTY; without even the implied warranty of
#MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#GNU General Public License for more details.
#
#You should have received a copy of the GNU General Public License
#along with this program.  If not, see <http://www.gnu.org/licenses/>.
# 

###
Adds TimeyWimey to the global scope, exposed as "TW".
@param  {Object} root The global object, usually 'window', 'module.exports',
or similar.
@return {Boolean}      Returns true when initialized.
###
not (setupTimeyWimey = (root) ->
  
  ###
  Constructor.  Adds event listeners to catch for user input, and initializes
  timer for idle detection.
  ###
  TimeyWimey = ->
    
    ###
    Resets the idle counter when user input is detected.
    @return {Number} Returns the reset counter.
    ###
    userInput = ->
      count = 0
      count
    i = undefined
    count = 0
    _this = this
    events = ["blur", "click", "contextmenu", "dblclick", "devicelight", "devicemotion", "deviceorientation", "deviceproximity", "drag", "dragend", "dragenter", "dragleave", "dragover", "dragstart", "drop", "focus", "fullscreenchange", "keydown", "keypress", "keyup", "mousedown", "mouseenter", "mouseleave", "mousemove", "mouseout", "mouseover", "mouseup", "resize", "scroll", "select", "show", "submit", "touchend", "touchenter", "touchleave", "touchmove", "touchstart", "wheel"]
    
    ###
    Initializes a timeout to track the delay between when it's called, and
    when it actually initializes.  There's a fuzziness which is expected, but
    anything longer than the fuzziness means the JS engine is working on
    something else, and thus isn't idle.
    
    @return {Number} Returns the timeout id.
    ###
    checkIdle = checkIdle = ->
      lastCalled = Date.now()
      fuzziness = 2
      
      ###
      Uses requestAnimationFrame to track the difference between when it
      was called last, and when it executes. Determines an idle state by
      speed at which it gets called over a short period of time, and when
      idle-ish, executes any queued tasks.
      @return {Function} Recursive; retruns checkIdle function.
      ###
      requestAnimationFrame (idle = ->
        now = Date.now()
        gap = now - lastCalled
        if gap > (_this.tick + fuzziness)
          count = 0
          _this.idle = false
        else
          lastCalled = now
          count++
        if count >= _this.idleThreshold
          _this.idle = true
          _this.executeIdleTasks()
        checkIdle()
      ), _this.tick

    @idleThreshold = 100
    @tick = 17
    @tasks = {}
    @defaultInterval = 100
    if root.document
      i = 0
      while i < events.length
        document.addEventListener events[i], userInput
        i++
    checkIdle()
  window.requestAnimationFrame = window.requestAnimationFrame or window.mozRequestAnimationFrame or window.webkitRequestAnimationFrame or window.msRequestAnimationFrame or window.setTimeout
  window.cancelAnimationFrame = window.cancelAnimationFrame or window.mozCancelAnimationFrame or window.webkitCancelAnimationFrame or window.msCancelAnimationFrame or window.clearTimeout
  
  ###
  Queues a task to be executed after a given delay.
  Similar to pubsub pattern.
  
  @param  {String}   label    Label identifying the tasks to execute.
  @param  {Function} callback The task to execute.
  @param  {Object}   options  Object containing two properties:
  'queue', and 'animation'.
  'queue' determines whether to add the callback
  to an array or not.
  Defaults to false.
  'animation' determines whether to use
  requestAnimationFrame or not.
  Defaults to true.
  @return {Object}            Returns the labeled object.
  ###
  TimeyWimey::queueTask = queueTask = (label, callback, options) ->
    timer = ->
      _this.executeTasks label
    cancelTask = ->
      cancelAnimationFrame _this.tasks[label].timer
    _this = this
    options = (if options then options else {})
    options.queue = options.queue or false
    options.animation = options.animation or true
    if @tasks[label]
      cancelTask()  if Date.now() - @tasks[label].start >= @tasks[label].timer
      @tasks[label].callbacks = @tasks[label].callbacks or []
      if @tasks[label].queue
        @tasks[label].callbacks.push callback
      else
        @tasks[label].callbacks = [callback]
    else
      @tasks[label] =
        callbacks: [callback]
        interval: @defaultInterval
        start: Date.now()
        queue: options.queue
        animation: options.animation
    if @tasks[label].animation and requestAnimationFrame
      @tasks[label].timer = requestAnimationFrame(timer)
    else
      @tasks[label].timer = setTimeout(timer, @tasks[label].interval)
    @tasks[label]

  
  ###
  Immediately executes any tasks queued for a given label.
  @param  {String} label The label for which tasks will be executed.
  @return {Boolean}       Returns true if tasks were executed, false if none
  existed for that label.
  ###
  TimeyWimey::executeTasks = executeTasks = (label) ->
    i = undefined
    _callbacks = undefined
    duration = undefined
    if @tasks[label].callbacks
      console.log "Executing deferred tasks for:", label
      @working()  if @tasks[label].interval > @defaultInterval
      @tasks[label].start = Date.now()
      _callbacks = @tasks[label].callbacks
      delete @tasks[label].callbacks

      i = 0
      while i < _callbacks.length
        _callbacks[i]()
        i++
      @tasks[label].end = Date.now()
      duration = @tasks[label].end - @tasks[label].start
      if duration > @tasks[label].interval
        @tasks[label].interval = duration
        @finished()
      true
    else
      false

  
  ###
  Executes the next task in any given queue, removing it from the queue.
  @param  {String} label The label corresponding to the desired queue.
  @return {Function}       Returns the task executed.
  ###
  TimeyWimey::nextTask = nextTask = (label) ->
    if @tasks[label].callbacks
      @tasks[label].callbacks[0]()
      @tasks[label].callbacks.shift()

  
  ###
  Executes the most recently added task to any queue, removing it from the
  queue.
  @param  {String} label The label corresponding to the desired queue.
  @return {Function}       Returns the task executed.
  ###
  TimeyWimey::lastTask = lastTask = (label) ->
    if @tasks[label].callbacks
      @tasks[label].callbacks[@tasks[label].callbacks.length - 1]()
      @tasks[label].callbacks.pop()

  
  ###
  Executes any and all tasks currently queued.
  @return {Boolean} Returns true after triggering executeTasks() method for
  each queue.
  ###
  TimeyWimey::executeIdleTasks = executeIdleTasks = ->
    each = undefined
    for each of @tasks
      if @tasks.hasOwnProperty(each)
        if @tasks[each].callbacks
          @tasks[each].interval = @defaultInterval
          @executeTasks each
    true

  
  ###
  Clears out a specific task, removing any items in its queue along with
  metadata.
  @param  {String} label The task label to flush.
  @return {Object}       The task which has been flushed.
  ###
  TimeyWimey::flushTask = flushTask = (label) ->
    task = @tasks[label]
    delete @tasks[label]

    task

  
  ###
  Clears all tasks, removing all queued items and metadata.  Start fresh!
  @return {Object} An object containing the tasks which have been deleted.
  ###
  TimeyWimey::flushAll = flushAll = ->
    tasks = @tasks
    each = undefined
    for each of @tasks
      delete @tasks[each]  if @tasks.hasOwnProperty(each)
    tasks

  
  ###
  Called when a Timeywimey thinks it is about to execute a long-running task.
  Should be overridden by specific implementaions, in order to provide custom
  feedback to the user; e.g. loading widgets, and the like.
  @return {Object} Logs to the console by default.
  ###
  TimeyWimey::working = working = ->
    console.log "Handling a potentially long-running task..."

  
  ###
  Called when Timeywimey finishes what it thinks was a long-running task.
  Should be overridden to match the working() method, providing custom
  feedback to the user that the task is now complete.
  @return {Object} Logs to the console by default.
  ###
  TimeyWimey::finished = finished = ->
    console.log "...Potentially long-running task complete."

  root.TW = new TimeyWimey()
(this))
