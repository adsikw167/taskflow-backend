const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const fs = require('fs');
const path = require('path');

// Upload attachment
const uploadAttachment = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    const task = await Task.findById(taskId);
    if (!task) {
      // Delete uploaded file if task not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    const attachment = await Attachment.create({
      task: taskId,
      uploadedBy: req.user._id,
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      url: `/uploads/${req.file.filename}`,
    });
    
    await attachment.populate('uploadedBy', 'name email avatar');
    
    // Create activity
    await Activity.create({
      project: task.project,
      task: taskId,
      user: req.user._id,
      action: 'file_uploaded',
      details: { filename: req.file.originalname, attachmentId: attachment._id },
    });
    
    res.status(201).json({ success: true, data: attachment });
  } catch (err) {
    // Clean up file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get attachments for a task
const getAttachments = async (req, res) => {
  try {
    const { taskId } = req.params;
    
    const attachments = await Attachment.find({ task: taskId })
      .populate('uploadedBy', 'name email avatar')
      .sort('-createdAt');
    
    res.status(200).json({ success: true, data: attachments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete attachment
const deleteAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    const attachment = await Attachment.findById(attachmentId);
    
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }
    
    // Check permission
    if (attachment.uploadedBy.toString() !== req.user._id.toString() && !req.user.isGlobalAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    // Delete file from filesystem
    if (fs.existsSync(attachment.path)) {
      fs.unlinkSync(attachment.path);
    }
    
    await attachment.deleteOne();
    
    res.status(200).json({ success: true, message: 'Attachment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Download attachment
const downloadAttachment = async (req, res) => {
  try {
    const { attachmentId } = req.params;
    
    const attachment = await Attachment.findById(attachmentId);
    
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found' });
    }
    
    if (!fs.existsSync(attachment.path)) {
      return res.status(404).json({ success: false, message: 'File not found on server' });
    }
    
    res.download(attachment.path, attachment.originalName);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  uploadAttachment,
  getAttachments,
  deleteAttachment,
  downloadAttachment,
};
