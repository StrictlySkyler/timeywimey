# timeywimey

![Timeywimey Device](http://25.media.tumblr.com/tumblr_lh1tjkLSkG1qa0q13o1_500.jpg)

A task scheduler and idle-detector for JavaScript.

## Purpose

Sometimes, a task takes a long time to run. During those sometimes, we also sometimes need to update the data which will power that task. (Animations, for example.) As such, we want to be able to execute the task, but only after we have the most up to date data.

Or, if it's an expensive task, we only want to do it when we think the JS engine isn't in the middle of anything, and the user isn't doing anything we'd cause to hang.

In other words, we need a scheduler with a li'l bit of brains in it.

## Usage

Scheduling a task is simple:

```javascript
TW.scheduleTask('breakfast', getSomeCoffee);
```

Timeywimey is smart enough to execute the task as soon as it can; either when it thinks your app is idle, or when the timer for that specific task occurs, but only of no new calls have been made to it in the meanwhile.

Given the above example, if another task is scheduled for `'breakfast'` before it's been triggered:

```javascript
TW.scheduleTask('breakfast', getSomeYogurt);
```

The timer is reset, and when it fires it'll trigger both tasks.

Also, if timeywimey thinks that the JS engine isn't doing anything intensive, it'll go ahead and execute your tasks for you.

## Options

`this.idleThreshold`
Determines how many ticks pass before timeywimey calls the system "idle".

`this.tick`
Determines how often to check whether the system is working or not.

`this.tasks`
A hash of all the tasks registered for timeywimey.  It's possible to browse this hash for various information about the tasks, or to modify them, if for some reason you need to do so.

`this.defaultInterval`
The default amount of time to wait before executing a task.  Increasing this provides more time for all tasks to wait before attempting to execute.

## API

Pop it in a script tag, use an async loader, or whathaveyou.  Provided in vanilla and coffee for your tasting preference.

`TW.queueTask(label, callback [, queue])`
Schedule `callback` to be executed when the `label` task is executed.  If the optional `queue` is true, the callback will be added to a queue, with any existing callbacks.  Queueing a task without passing something truthy as the third argument will default to `false`, which replaces the existing queue for this task with the single `callback` just passed.

`TW.executeTasks(label)`
Executes all queued tasks for a given queue.

`TW.executeIdleTasks()`
Used to execute all the queued tasks when the system is idle, but can be called to immediately execute all tasks.

`TW.working()`
Overrride this with whatever kind of logic and/or graphics you'd like to show when a long-running task occurs.

`TW.finished()`
Override this with the logic and/or graphics to show then that long-running task completes.

## Special Thanks

[@drpowell](https://github.com/drpowell) had the original idea, and the entire [OpenBio Codefest 2013](http://www.open-bio.org/wiki/Codefest_2013) group, from where this sprung.
