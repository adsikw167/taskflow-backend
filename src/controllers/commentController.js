const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Activity = require('../models/Activity');

// Get comments for a task
const getComments = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const comments = await Comment.find({ task: taskId })
      .populate('user', 'name email avatar')
      .populate('mentions', 'name email')
      .sort('createdAt');
    
    res.status(200).json({ success: true, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create comment
const createComment = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content, mentions } = req.body;
    
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const comment = await Comment.create({
      task: taskId,
      user: req.user._id,
      content,
      mentions: mentions || [],
    });
    
    await comment.populate('user', 'name email avatar');
    await comment.populate('mentions', 'name email');
    
    // Create activity
    await Activity.create({
      project: task.project,
      task: taskId,
      user: req.user._id,
      action: 'comment_added',
      details: { commentId: comment._id, preview: content.substring(0, 100) },
    });
    
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update comment
const updateComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    
    if (comment.user.toString() !== req.user._id.toString() && !req.user.isGlobalAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    comment.content = content;
    comment.edited = true;
    comment.editedAt = new Date();
    await comment.save();
    
    await comment.populate('user', 'name email avatar');
    
    res.status(200).json({ success: true, data: comment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete comment
const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    
    if (comment.user.toString() !== req.user._id.toString() && !req.user.isGlobalAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    await comment.deleteOne();
    
    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get project activity feed
const getProjectActivity = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 50 } = req.query;
    
    const activities = await Activity.find({ project: projectId })
      .populate('user', 'name email avatar')
      .populate('task', 'title')
      .sort('-createdAt')
      .limit(parseInt(limit));
    
    res.status(200).json({ success: true, data: activities });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  getProjectActivity,
};
