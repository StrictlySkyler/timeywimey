# Todo: add stepping through the tasks one by one!
not (setupSchedule = (root) ->
  Schedule = ->
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
    @defaultInterval = 1000
    checkIdle()
  Schedule::scheduleTask = scheduleTask = (label, callback) ->
    _this = this
    if @tasks[label]
      clearTimeout @tasks[label].timer  if Date.now() - @tasks[label].start >= @tasks[label].timer
      @tasks[label].callbacks = @tasks[label].callbacks or []
      @tasks[label].callbacks.push callback
    else
      @tasks[label] =
        callbacks: [callback]
        interval: @defaultInterval
        start: Date.now()
    @tasks[label].timer = setTimeout(->
      _this.executeTasks label
    , @tasks[label].interval)
    @tasks[label]

  Schedule::executeTasks = executeTasks = (label) ->
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

  Schedule::executeIdleTasks = executeIdleTasks = ->
    each = undefined
    for each of @tasks
      if @tasks.hasOwnProperty(each)
        if @tasks[each].callbacks
          @tasks[each].interval = @defaultInterval
          @executeTasks each

  Schedule::working = working = ->
    console.log "Handling a potentially long-running task..."

  Schedule::finished = finished = ->
    console.log "...Potentially long-running task complete."

  root.Schedule = new Schedule()
(this))
