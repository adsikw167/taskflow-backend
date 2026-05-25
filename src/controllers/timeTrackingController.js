const TimeLog = require('../models/TimeLog');
const Task = require('../models/Task');

// Start timer
const startTimer = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    // Check if task exists
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    // Check if user already has a running timer for this task
    const existingTimer = await TimeLog.findOne({
      task: taskId,
      user: req.user._id,
      isRunning: true,
    });
    
    if (existingTimer) {
      return res.status(400).json({ success: false, message: 'Timer already running for this task' });
    }
    
    // Create new time log
    const timeLog = await TimeLog.create({
      task: taskId,
      user: req.user._id,
      startTime: new Date(),
      isRunning: true,
    });
    
    await timeLog.populate('user', 'name email avatar');
    
    res.status(201).json({ success: true, data: timeLog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Stop timer
const stopTimer = async (req, res) => {
  try {
    const { timeLogId } = req.params;
    
    const timeLog = await TimeLog.findOne({
      _id: timeLogId,
      user: req.user._id,
      isRunning: true,
    });
    
    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'Running timer not found' });
    }
    
    timeLog.endTime = new Date();
    await timeLog.save(); // Duration calculated in pre-save hook
    
    // Update task's logged time
    const task = await Task.findById(timeLog.task);
    task.timeTracking.logged += timeLog.duration;
    await task.save();
    
    await timeLog.populate('user', 'name email avatar');
    
    res.status(200).json({ success: true, data: timeLog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get active timer for user
const getActiveTimer = async (req, res) => {
  try {
    const activeTimer = await TimeLog.findOne({
      user: req.user._id,
      isRunning: true,
    }).populate('task', 'title project');
    
    res.status(200).json({ success: true, data: activeTimer });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get time logs for a task
const getTaskTimeLogs = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const timeLogs = await TimeLog.find({ task: taskId })
      .populate('user', 'name email avatar')
      .sort('-createdAt');
    
    const totalTime = timeLogs.reduce((sum, log) => sum + log.duration, 0);
    
    res.status(200).json({
      success: true,
      data: timeLogs,
      totalTime,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add manual time entry
const addManualEntry = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { duration, description, date } = req.body;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const startTime = date ? new Date(date) : new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const timeLog = await TimeLog.create({
      task: taskId,
      user: req.user._id,
      startTime,
      endTime,
      duration,
      description,
      isRunning: false,
    });
    
    // Update task's logged time
    task.timeTracking.logged += duration;
    await task.save();
    
    await timeLog.populate('user', 'name email avatar');
    
    res.status(201).json({ success: true, data: timeLog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update time log
const updateTimeLog = async (req, res) => {
  try {
    const { timeLogId } = req.params;
    const { duration, description } = req.body;
    
    const timeLog = await TimeLog.findOne({
      _id: timeLogId,
      user: req.user._id,
    });
    
    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'Time log not found' });
    }
    
    if (timeLog.isRunning) {
      return res.status(400).json({ success: false, message: 'Cannot update running timer' });
    }
    
    const oldDuration = timeLog.duration;
    
    if (duration !== undefined) {
      timeLog.duration = duration;
      timeLog.endTime = new Date(timeLog.startTime.getTime() + duration * 60000);
    }
    
    if (description !== undefined) {
      timeLog.description = description;
    }
    
    await timeLog.save();
    
    // Update task's logged time
    if (duration !== undefined) {
      const task = await Task.findById(timeLog.task);
      task.timeTracking.logged = task.timeTracking.logged - oldDuration + duration;
      await task.save();
    }
    
    await timeLog.populate('user', 'name email avatar');
    
    res.status(200).json({ success: true, data: timeLog });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete time log
const deleteTimeLog = async (req, res) => {
  try {
    const { timeLogId } = req.params;
    
    const timeLog = await TimeLog.findOne({
      _id: timeLogId,
      user: req.user._id,
    });
    
    if (!timeLog) {
      return res.status(404).json({ success: false, message: 'Time log not found' });
    }
    
    if (timeLog.isRunning) {
      return res.status(400).json({ success: false, message: 'Cannot delete running timer' });
    }
    
    // Update task's logged time
    const task = await Task.findById(timeLog.task);
    task.timeTracking.logged -= timeLog.duration;
    await task.save();
    
    await timeLog.deleteOne();
    
    res.status(200).json({ success: true, message: 'Time log deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update task time estimate
const updateTimeEstimate = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { estimated } = req.body;
    
    const task = await Task.findByIdAndUpdate(
      taskId,
      { 'timeTracking.estimated': estimated },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  startTimer,
  stopTimer,
  getActiveTimer,
  getTaskTimeLogs,
  addManualEntry,
  updateTimeLog,
  deleteTimeLog,
  updateTimeEstimate,
};
