# Todo: 
# 1. Add stepping through the tasks one by one!
# 2. Tracking for user input!
not (setupTimeyWimey = (root) ->
  TimeyWimey = ->
    count = 0
    _this = this
    checkIdle = checkIdle = ->
      lastCalled = Date.now()
      setTimeout (idle = ->
        now = Date.now()
        gap = now - lastCalled
        if gap > (_this.tick + 2)
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
    @tick = 10
    @tasks = {}
    @defaultInterval = 100
    checkIdle()
  TimeyWimey::queueTask = queueTask = (label, callback, queue) ->
    _this = this
    queue = queue or false
    if @tasks[label]
      clearTimeout @tasks[label].timer  if Date.now() - @tasks[label].start >= @tasks[label].timer
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
        queue: queue
    @tasks[label].timer = setTimeout(->
      _this.executeTasks label
    , @tasks[label].interval)
    @tasks[label]

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

  TimeyWimey::executeIdleTasks = executeIdleTasks = ->
    each = undefined
    for each of @tasks
      if @tasks.hasOwnProperty(each)
        if @tasks[each].callbacks
          @tasks[each].interval = @defaultInterval
          @executeTasks each

  TimeyWimey::working = working = ->
    console.log "Handling a potentially long-running task..."

  TimeyWimey::finished = finished = ->
    console.log "...Potentially long-running task complete."

  root.TW = new TimeyWimey()
(this))
